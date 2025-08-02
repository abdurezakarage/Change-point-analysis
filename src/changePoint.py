

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import pymc as pm
import arviz as az
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

# Set style for better plots
plt.style.use('seaborn-v0_8')
sns.set_palette("husl")

class BayesianChangePointAnalyzer:
    
    def __init__(self, data_path, events_path=None):
        self.data_path = data_path
        self.events_path = events_path
        self.data = None
        self.events = None
        self.model = None
        self.trace = None
        self.log_returns = None
        
    def load_data(self):
        """Load and prepare the data for analysis."""
        print("Loading Brent oil price data...")
        
        # Load price data
        self.data = pd.read_csv(self.data_path)
        self.data['Date'] = pd.to_datetime(self.data['Date'])
        self.data = self.data.sort_values('Date').reset_index(drop=True)
        
        # Remove any rows with missing price data
        self.data = self.data.dropna(subset=['Price'])
        
        # Calculate log returns for better modeling
        self.data['Log_Returns'] = np.log(self.data['Price'] / self.data['Price'].shift(1))
        self.log_returns = self.data['Log_Returns'].dropna().values
        
        print(f"Loaded {len(self.data)} data points from {self.data['Date'].min()} to {self.data['Date'].max()}")
        
        # Load events data if provided
        if self.events_path:
            print("Loading events data...")
            self.events = pd.read_csv(self.events_path)
            self.events['date'] = pd.to_datetime(self.events['date'])
            print(f"Loaded {len(self.events)} significant events")
            
        return self.data
    
    def plot_raw_data(self, figsize=(15, 10)):
      
        fig, axes = plt.subplots(2, 2, figsize=figsize)
        
        # Price series over time
        axes[0, 0].plot(self.data['Date'], self.data['Price'], linewidth=0.8, alpha=0.8)
        axes[0, 0].set_title('Brent Oil Price Over Time')
        axes[0, 0].set_xlabel('Date')
        axes[0, 0].set_ylabel('Price (USD)')
        axes[0, 0].grid(True, alpha=0.3)
        
        # Log returns
        axes[0, 1].plot(self.data['Date'].iloc[1:], self.data['Log_Returns'].iloc[1:], 
                       linewidth=0.5, alpha=0.7, color='orange')
        axes[0, 1].set_title('Log Returns Over Time')
        axes[0, 1].set_xlabel('Date')
        axes[0, 1].set_ylabel('Log Returns')
        axes[0, 1].grid(True, alpha=0.3)
        
        # Price distribution
        axes[1, 0].hist(self.data['Price'], bins=50, alpha=0.7, edgecolor='black')
        axes[1, 0].set_title('Price Distribution')
        axes[1, 0].set_xlabel('Price (USD)')
        axes[1, 0].set_ylabel('Frequency')
        
        # Log returns distribution
        axes[1, 1].hist(self.data['Log_Returns'].dropna(), bins=50, alpha=0.7, 
                       edgecolor='black', color='orange')
        axes[1, 1].set_title('Log Returns Distribution')
        axes[1, 1].set_xlabel('Log Returns')
        axes[1, 1].set_ylabel('Frequency')
        
        plt.tight_layout()
        plt.show()
        
        # Print summary statistics
        print("\nData Summary Statistics:")
        print(f"Mean Price: ${self.data['Price'].mean():.2f}")
        print(f"Price Volatility: {self.data['Price'].std():.2f}")
        print(f"Mean Log Returns: {self.data['Log_Returns'].mean():.6f}")
        print(f"Log Returns Volatility: {self.data['Log_Returns'].std():.6f}")
    
    def build_change_point_model(self, n_changepoints=1):
     
        print(f"Building Bayesian Change Point model with {n_changepoints} change point(s)...")
        
        n_obs = len(self.log_returns)
        
        with pm.Model() as model:
            # Prior for change point location (uniform over all possible positions)
            if n_changepoints == 1:
                tau = pm.DiscreteUniform('tau', lower=1, upper=n_obs-1)
                
                # Parameters for the two regimes
                mu_1 = pm.Normal('mu_1', mu=0, sigma=0.1)  # Mean before change
                mu_2 = pm.Normal('mu_2', mu=0, sigma=0.1)  # Mean after change
                sigma_1 = pm.HalfNormal('sigma_1', sigma=0.1)  # Volatility before change
                sigma_2 = pm.HalfNormal('sigma_2', sigma=0.1)  # Volatility after change
                
                # Use switch function to select parameters based on change point
                mu = pm.math.switch(tau > np.arange(n_obs), mu_1, mu_2)
                sigma = pm.math.switch(tau > np.arange(n_obs), sigma_1, sigma_2)
                
                # Likelihood
                returns = pm.Normal('returns', mu=mu, sigma=sigma, observed=self.log_returns)
                
            else:
                # For multiple change points, we need a more complex model
                # This is a simplified version - in practice, you might want to use
                # a more sophisticated approach for multiple change points
                taus = pm.DiscreteUniform('taus', lower=1, upper=n_obs-1, shape=n_changepoints)
                
                # Sort change points to ensure they're in chronological order
                tau_sorted = pm.math.sort(taus)
                
                # Parameters for each regime
                mus = pm.Normal('mus', mu=0, sigma=0.1, shape=n_changepoints + 1)
                sigmas = pm.HalfNormal('sigmas', sigma=0.1, shape=n_changepoints + 1)
                
                # Create regime indicators
                regime = pm.math.zeros(n_obs, dtype=int)
                for i, tau in enumerate(tau_sorted):
                    regime = pm.math.switch(np.arange(n_obs) >= tau, i + 1, regime)
                
                # Select parameters based on regime
                mu = mus[regime]
                sigma = sigmas[regime]
                
                # Likelihood
                returns = pm.Normal('returns', mu=mu, sigma=sigma, observed=self.log_returns)
        
        self.model = model
        return model
    
    def run_mcmc(self, draws=2000, tune=1000, chains=2, return_inferencedata=True):
        """
        Run MCMC sampling for the change point model.
        
        Parameters:
        -----------
        draws : int
            Number of posterior samples to draw
        tune : int
            Number of tuning steps
        chains : int
            Number of MCMC chains
        return_inferencedata : bool
            Whether to return ArviZ InferenceData object
            
        Returns:
        --------
        arviz.InferenceData or pymc.backends.base.MultiTrace
            The MCMC trace
        """
        if self.model is None:
            raise ValueError("Model must be built before running MCMC")
        
        print(f"Running MCMC with {draws} draws, {tune} tuning steps, and {chains} chains...")
        
        with self.model:
            self.trace = pm.sample(
                draws=draws,
                tune=tune,
                chains=chains,
                return_inferencedata=return_inferencedata,
                random_seed=42
            )
        
        print("MCMC sampling completed!")
        return self.trace
    
    def check_convergence(self):
        """Check MCMC convergence using various diagnostics."""
        if self.trace is None:
            raise ValueError("Must run MCMC before checking convergence")
        
        print("Checking MCMC convergence...")
        
        # Summary statistics
        summary = az.summary(self.trace)
        print("\nParameter Summary:")
        print(summary)
        
        # R-hat values (should be close to 1.0)
        r_hat_values = summary['r_hat']
        print(f"\nR-hat values (should be close to 1.0):")
        for param, r_hat in r_hat_values.items():
            status = "✓" if r_hat < 1.1 else "✗"
            print(f"  {param}: {r_hat:.3f} {status}")
        
        # Plot trace plots
        az.plot_trace(self.trace)
        plt.tight_layout()
        plt.show()
        
        # Plot rank plots
        az.plot_rank(self.trace)
        plt.tight_layout()
        plt.show()
        
        return summary
    
    def analyze_change_points(self):
        """
        Analyze the detected change points and their implications.
        
        Returns:
        --------
        dict
            Dictionary containing change point analysis results
        """
        if self.trace is None:
            raise ValueError("Must run MCMC before analyzing change points")
        
        print("Analyzing detected change points...")
        
        # Extract posterior samples
        posterior = self.trace.posterior
        
        # Get change point location
        if 'tau' in posterior:
            tau_samples = posterior['tau'].values.flatten()
            tau_mean = np.mean(tau_samples)
            tau_std = np.std(tau_samples)
            
            # Convert to actual date
            change_date = self.data['Date'].iloc[int(tau_mean)]
            change_date_lower = self.data['Date'].iloc[int(tau_mean - 2*tau_std)]
            change_date_upper = self.data['Date'].iloc[int(tau_mean + 2*tau_std)]
            
            print(f"\nChange Point Analysis:")
            print(f"Most probable change point: {change_date.strftime('%Y-%m-%d')}")
            print(f"95% credible interval: {change_date_lower.strftime('%Y-%m-%d')} to {change_date_upper.strftime('%Y-%m-%d')}")
            
            # Get regime parameters
            mu_1_samples = posterior['mu_1'].values.flatten()
            mu_2_samples = posterior['mu_2'].values.flatten()
            sigma_1_samples = posterior['sigma_1'].values.flatten()
            sigma_2_samples = posterior['sigma_2'].values.flatten()
            
            # Calculate price levels before and after
            before_prices = self.data['Price'].iloc[:int(tau_mean)]
            after_prices = self.data['Price'].iloc[int(tau_mean):]
            
            mean_price_before = before_prices.mean()
            mean_price_after = after_prices.mean()
            price_change_pct = ((mean_price_after - mean_price_before) / mean_price_before) * 100
            
            print(f"\nPrice Impact Analysis:")
            print(f"Mean price before change point: ${mean_price_before:.2f}")
            print(f"Mean price after change point: ${mean_price_after:.2f}")
            print(f"Price change: {price_change_pct:+.2f}%")
            
            # Volatility analysis
            vol_before = before_prices.std()
            vol_after = after_prices.std()
            vol_change_pct = ((vol_after - vol_before) / vol_before) * 100
            
            print(f"Volatility before change point: {vol_before:.2f}")
            print(f"Volatility after change point: {vol_after:.2f}")
            print(f"Volatility change: {vol_change_pct:+.2f}%")
            
            # Plot posterior distributions
            self._plot_posterior_analysis(tau_samples, mu_1_samples, mu_2_samples, 
                                        sigma_1_samples, sigma_2_samples, change_date)
            
            # Associate with events if available
            if self.events is not None:
                self._associate_with_events(change_date)
            
            return {
                'change_date': change_date,
                'change_date_interval': (change_date_lower, change_date_upper),
                'mean_price_before': mean_price_before,
                'mean_price_after': mean_price_after,
                'price_change_pct': price_change_pct,
                'volatility_before': vol_before,
                'volatility_after': vol_after,
                'volatility_change_pct': vol_change_pct
            }
        
        else:
            print("Multiple change points detected - analysis not yet implemented")
            return None
    
    def _plot_posterior_analysis(self, tau_samples, mu_1_samples, mu_2_samples, 
                                sigma_1_samples, sigma_2_samples, change_date):
        """Plot posterior distributions and analysis."""
        fig, axes = plt.subplots(2, 3, figsize=(18, 12))
        
        # Change point location
        axes[0, 0].hist(tau_samples, bins=50, alpha=0.7, edgecolor='black')
        axes[0, 0].axvline(np.mean(tau_samples), color='red', linestyle='--', 
                          label=f'Mean: {np.mean(tau_samples):.0f}')
        axes[0, 0].set_title('Change Point Location (Days from Start)')
        axes[0, 0].set_xlabel('Day Index')
        axes[0, 0].set_ylabel('Frequency')
        axes[0, 0].legend()
        
        # Mean parameters
        axes[0, 1].hist(mu_1_samples, bins=50, alpha=0.7, label='Before', edgecolor='black')
        axes[0, 1].hist(mu_2_samples, bins=50, alpha=0.7, label='After', edgecolor='black')
        axes[0, 1].set_title('Mean Log Returns by Regime')
        axes[0, 1].set_xlabel('Mean Log Returns')
        axes[0, 1].set_ylabel('Frequency')
        axes[0, 1].legend()
        
        # Volatility parameters
        axes[0, 2].hist(sigma_1_samples, bins=50, alpha=0.7, label='Before', edgecolor='black')
        axes[0, 2].hist(sigma_2_samples, bins=50, alpha=0.7, label='After', edgecolor='black')
        axes[0, 2].set_title('Volatility by Regime')
        axes[0, 2].set_xlabel('Volatility')
        axes[0, 2].set_ylabel('Frequency')
        axes[0, 2].legend()
        
        # Price series with change point
        axes[1, 0].plot(self.data['Date'], self.data['Price'], linewidth=0.8, alpha=0.8)
        axes[1, 0].axvline(change_date, color='red', linestyle='--', linewidth=2, 
                          label=f'Change Point: {change_date.strftime("%Y-%m-%d")}')
        axes[1, 0].set_title('Price Series with Detected Change Point')
        axes[1, 0].set_xlabel('Date')
        axes[1, 0].set_ylabel('Price (USD)')
        axes[1, 0].legend()
        axes[1, 0].grid(True, alpha=0.3)
        
        # Log returns with change point
        axes[1, 1].plot(self.data['Date'].iloc[1:], self.data['Log_Returns'].iloc[1:], 
                       linewidth=0.5, alpha=0.7, color='orange')
        axes[1, 1].axvline(change_date, color='red', linestyle='--', linewidth=2)
        axes[1, 1].set_title('Log Returns with Detected Change Point')
        axes[1, 1].set_xlabel('Date')
        axes[1, 1].set_ylabel('Log Returns')
        axes[1, 1].grid(True, alpha=0.3)
        
        # Price distribution by regime
        tau_mean = np.mean(tau_samples)
        before_prices = self.data['Price'].iloc[:int(tau_mean)]
        after_prices = self.data['Price'].iloc[int(tau_mean):]
        
        axes[1, 2].hist(before_prices, bins=30, alpha=0.7, label='Before', edgecolor='black')
        axes[1, 2].hist(after_prices, bins=30, alpha=0.7, label='After', edgecolor='black')
        axes[1, 2].set_title('Price Distribution by Regime')
        axes[1, 2].set_xlabel('Price (USD)')
        axes[1, 2].set_ylabel('Frequency')
        axes[1, 2].legend()
        
        plt.tight_layout()
        plt.show()
    
    def _associate_with_events(self, change_date, window_days=30):
        """
        Associate detected change point with historical events.
        
        Parameters:
        -----------
        change_date : datetime
            The detected change point date
        window_days : int
            Number of days to look around the change point for events
        """
        print(f"\nAssociating change point with historical events (±{window_days} days)...")
        
        # Find events within the window
        window_start = change_date - timedelta(days=window_days)
        window_end = change_date + timedelta(days=window_days)
        
        nearby_events = self.events[
            (self.events['date'] >= window_start) & 
            (self.events['date'] <= window_end)
        ].copy()
        
        if len(nearby_events) > 0:
            nearby_events['days_from_change'] = (nearby_events['date'] - change_date).dt.days
            nearby_events = nearby_events.sort_values('days_from_change')
            
            print(f"Found {len(nearby_events)} events near the change point:")
            for _, event in nearby_events.iterrows():
                days_diff = event['days_from_change']
                direction = "before" if days_diff < 0 else "after"
                print(f"  {event['date'].strftime('%Y-%m-%d')} ({abs(days_diff)} days {direction}): {event['event']} ({event['category']})")
        else:
            print("No significant events found within the specified window.")
            print("This could indicate:")
            print("  - A gradual structural change rather than an event-driven change")
            print("  - Market anticipation of future events")
            print("  - Technical factors or market dynamics")
    
    def generate_report(self, output_path=None):
        """
        Generate a comprehensive analysis report.
        
        Parameters:
        -----------
        output_path : str, optional
            Path to save the report
        """
        if self.trace is None:
            raise ValueError("Must run analysis before generating report")
        
        print("Generating comprehensive analysis report...")
        
        # Get analysis results
        results = self.analyze_change_points()
        
        # Create report
        report = f"""
BAYESIAN CHANGE POINT ANALYSIS REPORT
====================================

Data Overview:
- Analysis period: {self.data['Date'].min().strftime('%Y-%m-%d')} to {self.data['Date'].max().strftime('%Y-%m-%d')}
- Total observations: {len(self.data):,}
- Data frequency: Daily

Model Specification:
- Model type: Bayesian Change Point Detection
- Likelihood: Normal distribution with regime-dependent parameters
- Prior: Uniform distribution for change point location
- MCMC: Hamiltonian Monte Carlo with NUTS sampler

Results Summary:
- Detected change point: {results['change_date'].strftime('%Y-%m-%d')}
- 95% credible interval: {results['change_date_interval'][0].strftime('%Y-%m-%d')} to {results['change_date_interval'][1].strftime('%Y-%m-%d')}

Price Impact Analysis:
- Mean price before change: ${results['mean_price_before']:.2f}
- Mean price after change: ${results['mean_price_after']:.2f}
- Percentage change: {results['price_change_pct']:+.2f}%

Volatility Analysis:
- Volatility before change: {results['volatility_before']:.2f}
- Volatility after change: {results['volatility_after']:.2f}
- Volatility change: {results['volatility_change_pct']:+.2f}%

Interpretation:
The Bayesian change point model detected a significant structural break in the Brent oil price series. 
This change point represents a shift in the underlying data generating process, which could be due to:

1. Economic factors (recession, growth acceleration)
2. Geopolitical events (conflicts, sanctions, policy changes)
3. Technological developments (shale revolution, renewable energy)
4. Market structure changes (new participants, trading mechanisms)

The {results['price_change_pct']:+.1f}% change in mean price and {results['volatility_change_pct']:+.1f}% change in volatility 
suggest a fundamental shift in market dynamics around {results['change_date'].strftime('%Y-%m-%d')}.

Recommendations:
1. Investigate specific events around the detected change point
2. Consider multiple change point models for more complex dynamics
3. Incorporate additional variables (GDP, exchange rates, etc.) for enhanced analysis
4. Validate findings with domain experts and historical context

Future Work:
- Implement multiple change point detection
- Add regime-dependent volatility models (GARCH)
- Incorporate external variables (VAR models)
- Develop real-time change point monitoring systems
"""
        
        if output_path:
            with open(output_path, 'w') as f:
                f.write(report)
            print(f"Report saved to {output_path}")
        else:
            print(report)
        
        return report


def main():
    """Main function to run the complete analysis."""
    # Initialize analyzer
    analyzer = BayesianChangePointAnalyzer(
        data_path='../data/processed/processed_brent_oil_data.csv',
        events_path='../data/processed/event_dataset.csv'
    )
    
    # Load data
    data = analyzer.load_data()
    
    # Plot raw data
    analyzer.plot_raw_data()
    
    # Build and run model
    model = analyzer.build_change_point_model(n_changepoints=1)
    trace = analyzer.run_mcmc(draws=2000, tune=1000, chains=2)
    
    # Check convergence
    summary = analyzer.check_convergence()
    
    # Analyze results
    results = analyzer.analyze_change_points()
    
    # Generate report
    report = analyzer.generate_report('../data/processed/change_point_analysis_report.txt')
    
    print("\nAnalysis completed successfully!")
    print("Check the generated plots and report for detailed results.")


if __name__ == "__main__":
    main()
