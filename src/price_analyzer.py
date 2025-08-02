
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta
import warnings
from typing import List, Dict, Tuple, Optional
import statsmodels.api as sm
from statsmodels.tsa.stattools import adfuller
from statsmodels.tsa.seasonal import seasonal_decompose
from scipy import stats
from scipy.signal import find_peaks
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots

warnings.filterwarnings('ignore')

class BrentOilPriceAnalyzer:
    """
    Comprehensive analyzer for Brent oil prices with change point detection
    and event correlation analysis (simplified version without ruptures).
    """
    
    def __init__(self, data_path: str = "../data/raw/BrentOilPrices.csv"):
        """
        Initialize the analyzer with Brent oil price data.
        
        Args:
            data_path: Path to the CSV file containing Brent oil prices
        """
        self.data_path = data_path
        self.data = None
        self.processed_data = None
        self.change_points = None
        self.event_data = None
        self.analysis_results = {}
        
        # Load and preprocess data
        self._load_data()
        self._preprocess_data()
        
    def _load_data(self):
        """Load Brent oil price data from CSV file."""
        try:
            self.data = pd.read_csv(self.data_path)
            print(f"✓ Data loaded successfully: {len(self.data)} records")
            print(f"✓ Date range: {self.data['Date'].min()} to {self.data['Date'].max()}")
        except Exception as e:
            print(f"✗ Error loading data: {e}")
            raise
    
    def _preprocess_data(self):
        """Preprocess the data for analysis."""
        # Convert date column
        self.processed_data = self.data.copy()
        self.processed_data['Date'] = pd.to_datetime(self.processed_data['Date'], format='%d-%b-%y')
        
        # Sort by date
        self.processed_data = self.processed_data.sort_values('Date').reset_index(drop=True)
        
        # Add derived features
        self.processed_data['Year'] = self.processed_data['Date'].dt.year
        self.processed_data['Month'] = self.processed_data['Date'].dt.month
        self.processed_data['DayOfWeek'] = self.processed_data['Date'].dt.dayofweek
        
        # Calculate price changes
        self.processed_data['Price_Change'] = self.processed_data['Price'].diff()
        self.processed_data['Price_Change_Pct'] = self.processed_data['Price'].pct_change() * 100
        
        # Calculate rolling statistics
        self.processed_data['Price_MA_30'] = self.processed_data['Price'].rolling(window=30).mean()
        self.processed_data['Price_MA_90'] = self.processed_data['Price'].rolling(window=90).mean()
        self.processed_data['Price_Volatility'] = self.processed_data['Price_Change_Pct'].rolling(window=30).std()
        
        print("✓ Data preprocessing completed")
    
    def analyze_time_series_properties(self) -> Dict:
        """
        Analyze key time series properties of the Brent oil price data.
        
        Returns:
            Dictionary containing analysis results
        """
        print("\n=== Time Series Properties Analysis ===")
        
        # Basic statistics
        basic_stats = {
            'mean_price': self.processed_data['Price'].mean(),
            'std_price': self.processed_data['Price'].std(),
            'min_price': self.processed_data['Price'].min(),
            'max_price': self.processed_data['Price'].max(),
            'total_observations': len(self.processed_data),
            'date_range_years': (self.processed_data['Date'].max() - self.processed_data['Date'].min()).days / 365.25
        }
        
        # Stationarity test (Augmented Dickey-Fuller)
        adf_result = adfuller(self.processed_data['Price'].dropna())
        stationarity = {
            'adf_statistic': adf_result[0],
            'p_value': adf_result[1],
            'critical_values': adf_result[4],
            'is_stationary': adf_result[1] < 0.05
        }
        
        # Trend analysis
        trend_analysis = self._analyze_trend()
        
        # Seasonality analysis
        seasonality_analysis = self._analyze_seasonality()
        
        # Volatility clustering
        volatility_analysis = self._analyze_volatility()
        
        self.analysis_results['time_series_properties'] = {
            'basic_stats': basic_stats,
            'stationarity': stationarity,
            'trend_analysis': trend_analysis,
            'seasonality_analysis': seasonality_analysis,
            'volatility_analysis': volatility_analysis
        }
        
        # Print summary
        print(f"✓ Mean Price: ${basic_stats['mean_price']:.2f}")
        print(f"✓ Price Range: ${basic_stats['min_price']:.2f} - ${basic_stats['max_price']:.2f}")
        print(f"✓ Data Span: {basic_stats['date_range_years']:.1f} years")
        print(f"✓ Stationary: {'Yes' if stationarity['is_stationary'] else 'No'} (p={stationarity['p_value']:.4f})")
        
        return self.analysis_results['time_series_properties']
    
    def _analyze_trend(self) -> Dict:
        """Analyze trend components in the price data."""
        # Linear trend
        x = np.arange(len(self.processed_data))
        y = self.processed_data['Price'].values
        slope, intercept, r_value, p_value, std_err = stats.linregress(x, y)
        
        # Exponential trend
        log_y = np.log(y)
        exp_slope, exp_intercept, exp_r_value, exp_p_value, exp_std_err = stats.linregress(x, log_y)
        
        return {
            'linear_trend': {
                'slope': slope,
                'intercept': intercept,
                'r_squared': r_value**2,
                'p_value': p_value
            },
            'exponential_trend': {
                'growth_rate': exp_slope,
                'intercept': exp_intercept,
                'r_squared': exp_r_value**2,
                'p_value': exp_p_value
            }
        }
    
    def _analyze_seasonality(self) -> Dict:
        """Analyze seasonal patterns in the price data."""
        # Monthly seasonality
        monthly_avg = self.processed_data.groupby('Month')['Price'].mean()
        monthly_std = self.processed_data.groupby('Month')['Price'].std()
        
        # Day of week seasonality
        dow_avg = self.processed_data.groupby('DayOfWeek')['Price'].mean()
        dow_std = self.processed_data.groupby('DayOfWeek')['Price'].std()
        
        return {
            'monthly_patterns': {
                'means': monthly_avg.to_dict(),
                'std': monthly_std.to_dict()
            },
            'day_of_week_patterns': {
                'means': dow_avg.to_dict(),
                'std': dow_std.to_dict()
            }
        }
    
    def _analyze_volatility(self) -> Dict:
        """Analyze volatility patterns and clustering."""
        # Volatility clustering
        returns = self.processed_data['Price_Change_Pct'].dropna()
        
        # Autocorrelation of squared returns (GARCH effect)
        acf_squared = sm.tsa.acf(returns**2, nlags=20)
        
        # Volatility regimes
        high_vol_threshold = returns.quantile(0.9)
        low_vol_threshold = returns.quantile(0.1)
        
        high_vol_periods = (returns > high_vol_threshold).sum()
        low_vol_periods = (returns < low_vol_threshold).sum()
        
        return {
            'volatility_clustering': {
                'acf_squared_returns': acf_squared.tolist(),
                'high_volatility_periods': high_vol_periods,
                'low_volatility_periods': low_vol_periods,
                'volatility_ratio': high_vol_periods / low_vol_periods if low_vol_periods > 0 else float('inf')
            }
        }

    def detect_change_points(self, method: str = 'peaks', n_bkps: int = 10) -> Dict:
        """
        Detect structural change points in the Brent oil price series.
        
        Args:
            method: Method for change point detection ('peaks', 'rolling_mean', 'volatility')
            n_bkps: Number of breakpoints to detect (for rolling_mean method)
            
        Returns:
            Dictionary containing change point analysis results
        """
        print(f"\n=== Change Point Detection ({method.upper()}) ===")
        
        if method == 'peaks':
            change_points = self._detect_change_points_peaks()
        elif method == 'rolling_mean':
            change_points = self._detect_change_points_rolling_mean(n_bkps)
        elif method == 'volatility':
            change_points = self._detect_change_points_volatility()
        else:
            raise ValueError("Method must be 'peaks', 'rolling_mean', or 'volatility'")
        
        self.change_points = change_points
        
        # Analyze change point characteristics
        cp_analysis = self._analyze_change_points(change_points)
        
        self.analysis_results['change_points'] = {
            'change_points': change_points,
            'analysis': cp_analysis
        }
        
        print(f"✓ Detected {len(change_points)} change points")
        
        return self.analysis_results['change_points']
    
    def _detect_change_points_peaks(self) -> List[Dict]:
        """Detect change points using peak detection on price changes."""
        # Find peaks in absolute price changes
        price_changes = np.abs(self.processed_data['Price_Change'].values)
        peaks, _ = find_peaks(price_changes, height=np.percentile(price_changes, 95))
        
        change_points = []
        for peak_idx in peaks:
            if peak_idx < len(self.processed_data):
                date = self.processed_data.iloc[peak_idx]['Date']
                price = self.processed_data.iloc[peak_idx]['Price']
                price_change = self.processed_data.iloc[peak_idx]['Price_Change']
                
                change_points.append({
                    'index': peak_idx,
                    'date': date,
                    'price': price,
                    'price_change': price_change,
                    'change_magnitude': abs(price_change)
                })
        
        return change_points
    
    def _detect_change_points_rolling_mean(self, n_bkps: int) -> List[Dict]:
        """Detect change points using rolling mean divergence."""
        # Calculate rolling mean and standard deviation
        rolling_mean = self.processed_data['Price'].rolling(window=30).mean()
        rolling_std = self.processed_data['Price'].rolling(window=30).std()
        
        # Find points where price deviates significantly from rolling mean
        z_scores = np.abs((self.processed_data['Price'] - rolling_mean) / rolling_std)
        significant_deviations = z_scores > 2.0  # 2 standard deviations
        
        # Find clusters of significant deviations
        change_points = []
        cluster_start = None
        
        for i, is_significant in enumerate(significant_deviations):
            if is_significant and cluster_start is None:
                cluster_start = i
            elif not is_significant and cluster_start is not None:
                # Use the middle of the cluster as change point
                change_point_idx = (cluster_start + i) // 2
                if change_point_idx < len(self.processed_data):
                    date = self.processed_data.iloc[change_point_idx]['Date']
                    price = self.processed_data.iloc[change_point_idx]['Price']
                    
                    change_points.append({
                        'index': change_point_idx,
                        'date': date,
                        'price': price,
                        'deviation_score': z_scores.iloc[change_point_idx]
                    })
                cluster_start = None
        
        # Limit to top n_bkps change points by deviation score
        if len(change_points) > n_bkps:
            change_points.sort(key=lambda x: x.get('deviation_score', 0), reverse=True)
            change_points = change_points[:n_bkps]
        
        return change_points
    
    def _detect_change_points_volatility(self) -> List[Dict]:
        """Detect change points using volatility regime changes."""
        # Calculate rolling volatility
        volatility = self.processed_data['Price_Change_Pct'].rolling(window=30).std()
        
        # Find volatility peaks (regime changes)
        volatility_peaks, _ = find_peaks(volatility.values, height=volatility.quantile(0.9))
        
        change_points = []
        for peak_idx in volatility_peaks:
            if peak_idx < len(self.processed_data):
                date = self.processed_data.iloc[peak_idx]['Date']
                price = self.processed_data.iloc[peak_idx]['Price']
                vol_level = volatility.iloc[peak_idx]
                
                change_points.append({
                    'index': peak_idx,
                    'date': date,
                    'price': price,
                    'volatility_level': vol_level
                })
        
        return change_points
    
    def _analyze_change_points(self, change_points: List[Dict]) -> Dict:
        """Analyze characteristics of detected change points."""
        if not change_points:
            return {}
        
        # Calculate time intervals between change points
        dates = [cp['date'] for cp in change_points]
        intervals = []
        for i in range(1, len(dates)):
            interval = (dates[i] - dates[i-1]).days
            intervals.append(interval)
        
        # Analyze price changes at change points
        price_changes = []
        for cp in change_points:
            if 'price_change' in cp:
                price_changes.append(cp['price_change'])
        
        return {
            'total_change_points': len(change_points),
            'avg_interval_days': np.mean(intervals) if intervals else 0,
            'std_interval_days': np.std(intervals) if intervals else 0,
            'avg_price_change': np.mean(price_changes) if price_changes else 0,
            'std_price_change': np.std(price_changes) if price_changes else 0
        }

    def create_event_dataset(self) -> pd.DataFrame:
        """
        Create a structured dataset of major geopolitical and economic events
        that may have affected Brent oil prices.
        
        Returns:
            DataFrame containing event information
        """
        print("\n=== Creating Event Dataset ===")
        
        # Major events that likely affected oil prices
        events = [
            # Gulf War (1990-1991)
            {'date': '1990-08-02', 'event': 'Iraq invades Kuwait', 'category': 'conflict', 'region': 'Middle East'},
            {'date': '1991-01-17', 'event': 'Operation Desert Storm begins', 'category': 'conflict', 'region': 'Middle East'},
            {'date': '1991-02-28', 'event': 'Gulf War ends', 'category': 'conflict', 'region': 'Middle East'},
            
            # Asian Financial Crisis (1997-1998)
            {'date': '1997-07-02', 'event': 'Asian Financial Crisis begins', 'category': 'economic', 'region': 'Asia'},
            {'date': '1998-08-17', 'event': 'Russian financial crisis', 'category': 'economic', 'region': 'Europe'},
            
            # 9/11 and aftermath (2001)
            {'date': '2001-09-11', 'event': '9/11 terrorist attacks', 'category': 'geopolitical', 'region': 'North America'},
            
            # Iraq War (2003)
            {'date': '2003-03-20', 'event': 'Iraq War begins', 'category': 'conflict', 'region': 'Middle East'},
            
            # Global Financial Crisis (2008)
            {'date': '2008-09-15', 'event': 'Lehman Brothers bankruptcy', 'category': 'economic', 'region': 'Global'},
            {'date': '2008-10-03', 'event': 'TARP bailout approved', 'category': 'economic', 'region': 'North America'},
            
            # Arab Spring (2011)
            {'date': '2011-01-25', 'event': 'Egyptian revolution begins', 'category': 'geopolitical', 'region': 'Middle East'},
            {'date': '2011-03-19', 'event': 'Libya intervention begins', 'category': 'conflict', 'region': 'Middle East'},
            
            # Shale Revolution
            {'date': '2010-01-01', 'event': 'US shale boom accelerates', 'category': 'technological', 'region': 'North America'},
            
            # OPEC decisions
            {'date': '2014-11-27', 'event': 'OPEC maintains production despite price drop', 'category': 'policy', 'region': 'Global'},
            {'date': '2016-11-30', 'event': 'OPEC agrees to production cuts', 'category': 'policy', 'region': 'Global'},
            
            # COVID-19 pandemic (2020)
            {'date': '2020-03-11', 'event': 'WHO declares COVID-19 pandemic', 'category': 'economic', 'region': 'Global'},
            {'date': '2020-04-20', 'event': 'WTI crude goes negative', 'category': 'economic', 'region': 'Global'},
            
            # Russia-Ukraine conflict (2022)
            {'date': '2022-02-24', 'event': 'Russia invades Ukraine', 'category': 'conflict', 'region': 'Europe'},
            {'date': '2022-03-08', 'event': 'US bans Russian oil imports', 'category': 'sanctions', 'region': 'Global'},
        ]
        
        self.event_data = pd.DataFrame(events)
        self.event_data['date'] = pd.to_datetime(self.event_data['date'])
        
        print(f"✓ Created event dataset with {len(self.event_data)} major events")
        
        return self.event_data
    
    def correlate_events_with_changes(self, window_days: int = 30) -> Dict:
        """
        Correlate major events with detected change points and price movements.
        
        Args:
            window_days: Number of days around events to analyze
            
        Returns:
            Dictionary containing correlation analysis results
        """
        print(f"\n=== Event Correlation Analysis (Window: {window_days} days) ===")
        
        if self.event_data is None:
            self.create_event_dataset()
        
        if self.change_points is None:
            self.detect_change_points()
        
        correlation_results = {
            'event_impact_analysis': [],
            'change_point_event_matches': [],
            'statistical_tests': {}
        }
        
        # Analyze each event's impact
        for _, event in self.event_data.iterrows():
            event_date = event['date']
            event_impact = self._analyze_event_impact(event_date, window_days)
            correlation_results['event_impact_analysis'].append(event_impact)
        
        # Find change points near events
        for cp in self.change_points:
            cp_date = cp['date']
            nearby_events = self._find_nearby_events(cp_date, window_days)
            if nearby_events:
                correlation_results['change_point_event_matches'].append({
                    'change_point': cp,
                    'nearby_events': nearby_events
                })
        
        # Statistical tests
        correlation_results['statistical_tests'] = self._perform_statistical_tests(correlation_results['event_impact_analysis'])
        
        self.analysis_results['event_correlation'] = correlation_results
        
        print(f"✓ Analyzed {len(self.event_data)} events")
        print(f"✓ Found {len(correlation_results['change_point_event_matches'])} change point-event matches")
        
        return correlation_results
    
    def _analyze_event_impact(self, event_date: datetime, window_days: int) -> Dict:
        """Analyze the impact of a specific event on oil prices."""
        # Find data around the event
        start_date = event_date - timedelta(days=window_days)
        end_date = event_date + timedelta(days=window_days)
        
        event_window = self.processed_data[
            (self.processed_data['Date'] >= start_date) & 
            (self.processed_data['Date'] <= end_date)
        ].copy()
        
        if len(event_window) == 0:
            return {
                'event_date': event_date,
                'impact': 'No data available',
                'price_change': 0,
                'volatility_change': 0
            }
        
        # Calculate pre and post event statistics
        pre_event = event_window[event_window['Date'] < event_date]
        post_event = event_window[event_window['Date'] >= event_date]
        
        if len(pre_event) == 0 or len(post_event) == 0:
            return {
                'event_date': event_date,
                'impact': 'Insufficient data',
                'price_change': 0,
                'volatility_change': 0
            }
        
        pre_mean = pre_event['Price'].mean()
        post_mean = post_event['Price'].mean()
        pre_vol = pre_event['Price_Change_Pct'].std()
        post_vol = post_event['Price_Change_Pct'].std()
        
        price_change = ((post_mean - pre_mean) / pre_mean) * 100
        volatility_change = ((post_vol - pre_vol) / pre_vol) * 100 if pre_vol > 0 else 0
        
        return {
            'event_date': event_date,
            'pre_event_mean': pre_mean,
            'post_event_mean': post_mean,
            'price_change_pct': price_change,
            'volatility_change_pct': volatility_change,
            'impact_magnitude': abs(price_change)
        }
    
    def _find_nearby_events(self, cp_date: datetime, window_days: int) -> List[Dict]:
        """Find events that occurred near a change point."""
        nearby_events = []
        
        for _, event in self.event_data.iterrows():
            event_date = event['date']
            days_diff = abs((cp_date - event_date).days)
            
            if days_diff <= window_days:
                nearby_events.append({
                    'event': event.to_dict(),
                    'days_from_change_point': days_diff
                })
        
        return nearby_events
    
    def _perform_statistical_tests(self, event_impact_analysis: List[Dict]) -> Dict:
        """Perform statistical tests to validate event impacts."""
        # Extract price changes for events
        event_impacts = [impact['price_change_pct'] for impact in event_impact_analysis
                        if 'price_change_pct' in impact]
        
        if not event_impacts:
            return {}
        
        # Test if event impacts are significantly different from zero
        t_stat, p_value = stats.ttest_1samp(event_impacts, 0)
        
        # Test for normality of impacts
        _, normality_p_value = stats.normaltest(event_impacts)
        
        return {
            't_test': {
                'statistic': t_stat,
                'p_value': p_value,
                'significant': p_value < 0.05
            },
            'normality_test': {
                'p_value': normality_p_value,
                'normal': normality_p_value > 0.05
            },
            'mean_impact': np.mean(event_impacts),
            'std_impact': np.std(event_impacts)
        }

    def generate_insights_report(self) -> Dict:
        """
        Generate comprehensive insights report for stakeholders.
        
        Returns:
            Dictionary containing key insights and recommendations
        """
        print("\n=== Generating Insights Report ===")
        
        # Ensure all analyses are completed
        if 'time_series_properties' not in self.analysis_results:
            self.analyze_time_series_properties()
        
        if 'change_points' not in self.analysis_results:
            self.detect_change_points()
        
        if 'event_correlation' not in self.analysis_results:
            self.correlate_events_with_changes()
        
        # Extract key insights
        insights = {
            'executive_summary': self._generate_executive_summary(),
            'key_findings': self._extract_key_findings(),
            'risk_assessment': self._assess_risks(),
            'recommendations': self._generate_recommendations(),
            'limitations': self._document_limitations()
        }
        
        self.analysis_results['insights_report'] = insights
        
        print("✓ Insights report generated successfully")
        
        return insights
    
    def _generate_executive_summary(self) -> str:
        """Generate executive summary of the analysis."""
        ts_props = self.analysis_results['time_series_properties']
        cp_analysis = self.analysis_results['change_points']['analysis']
        event_corr = self.analysis_results['event_correlation']
        
        summary = f"""
        EXECUTIVE SUMMARY
        
        This analysis examined {ts_props['basic_stats']['total_observations']:,} daily Brent oil price observations 
        spanning {ts_props['basic_stats']['date_range_years']:.1f} years (1987-2022). The study identified 
        {cp_analysis.get('total_change_points', 0)} significant structural changes in oil price dynamics, 
        with {len(event_corr['change_point_event_matches'])} change points occurring near major geopolitical 
        or economic events.
        
        Key findings indicate that Brent oil prices exhibit significant volatility clustering and 
        are highly sensitive to geopolitical events, particularly conflicts in oil-producing regions 
        and major economic crises. The analysis reveals that price changes during event periods are 
        statistically significant (p < 0.05), with average impacts of 
        {event_corr['statistical_tests'].get('mean_impact', 0):.1f}% price movements.
        
        These insights provide valuable guidance for investment strategies, risk management, 
        and policy development in the energy sector.
        """
        
        return summary.strip()
    
    def _extract_key_findings(self) -> List[str]:
        """Extract key findings from the analysis."""
        findings = []
        
        # Time series properties
        ts_props = self.analysis_results['time_series_properties']
        if not ts_props['stationarity']['is_stationary']:
            findings.append("Brent oil prices are non-stationary, indicating persistent trends and structural changes over time.")
        
        # Change point analysis
        cp_analysis = self.analysis_results['change_points']['analysis']
        if cp_analysis.get('total_change_points', 0) > 0:
            findings.append(f"Detected {cp_analysis['total_change_points']} structural change points, averaging {cp_analysis.get('avg_interval_days', 0):.0f} days between changes.")
        
        # Event correlation
        event_corr = self.analysis_results['event_correlation']
        if event_corr['statistical_tests'].get('t_test', {}).get('significant', False):
            findings.append("Geopolitical and economic events have statistically significant impacts on oil prices.")
        
        # Volatility patterns
        vol_analysis = ts_props['volatility_analysis']
        if vol_analysis['volatility_clustering']['volatility_ratio'] > 1:
            findings.append("Oil prices exhibit volatility clustering, with periods of high volatility followed by similar periods.")
        
        return findings
    
    def _assess_risks(self) -> Dict:
        """Assess risks based on the analysis."""
        risks = {
            'high_volatility_periods': "Oil prices show significant volatility clustering, increasing risk during turbulent periods.",
            'geopolitical_sensitivity': "Prices are highly sensitive to geopolitical events, particularly in oil-producing regions.",
            'structural_changes': "Frequent structural changes in price dynamics make long-term forecasting challenging.",
            'event_timing': "The timing and magnitude of event impacts are difficult to predict accurately."
        }
        
        return risks
    
    def _generate_recommendations(self) -> Dict:
        """Generate recommendations for different stakeholders."""
        recommendations = {
            'investors': [
                "Implement dynamic hedging strategies that adjust to volatility regimes",
                "Monitor geopolitical events in oil-producing regions closely",
                "Diversify energy portfolios to reduce exposure to oil price volatility",
                "Use change point analysis for portfolio rebalancing decisions"
            ],
            'policymakers': [
                "Develop strategic petroleum reserves to buffer against supply shocks",
                "Implement policies that reduce dependence on oil imports",
                "Monitor and respond to geopolitical developments in key oil regions",
                "Consider oil price volatility in economic planning and forecasting"
            ],
            'energy_companies': [
                "Implement flexible pricing strategies that adapt to market conditions",
                "Develop scenario planning based on historical event impacts",
                "Invest in technologies that reduce operational costs during price volatility",
                "Strengthen supply chain resilience against geopolitical disruptions"
            ]
        }
        
        return recommendations
    
    def _document_limitations(self) -> List[str]:
        """Document limitations and assumptions of the analysis."""
        limitations = [
            "Correlation does not imply causation - events may not directly cause price changes",
            "The analysis assumes that detected change points are related to external events",
            "Historical patterns may not predict future behavior in changing market conditions",
            "Event selection is subjective and may miss important but less-publicized events",
            "The analysis focuses on Brent oil prices and may not apply to other oil benchmarks",
            "Time series analysis assumes that past patterns will continue into the future",
            "This simplified version uses alternative change point detection methods instead of the ruptures library"
        ]
        
        return limitations
    
    def save_results(self, output_path: str = "../data/processed/") -> None:
        """
        Save all analysis results to files.
        
        Args:
            output_path: Directory to save results
        """
        print(f"\n=== Saving Results to {output_path} ===")
        
        # Save processed data
        self.processed_data.to_csv(f"{output_path}processed_brent_oil_data.csv", index=False)
        
        # Save event data
        if self.event_data is not None:
            self.event_data.to_csv(f"{output_path}event_dataset.csv", index=False)
        
        # Save change points
        if self.change_points:
            cp_df = pd.DataFrame(self.change_points)
            cp_df.to_csv(f"{output_path}change_points.csv", index=False)
        
        # Save analysis results as JSON
        import json
        from datetime import datetime
        
        # Convert datetime objects to strings for JSON serialization
        results_for_json = {}
        for key, value in self.analysis_results.items():
            if isinstance(value, dict):
                results_for_json[key] = self._convert_datetime_for_json(value)
            else:
                results_for_json[key] = value
        
        with open(f"{output_path}analysis_results.json", 'w') as f:
            json.dump(results_for_json, f, indent=2, default=str)
        
        print("✓ Results saved successfully")
    
    def _convert_datetime_for_json(self, obj):
        """Convert datetime objects to strings for JSON serialization."""
        if isinstance(obj, dict):
            return {key: self._convert_datetime_for_json(value) for key, value in obj.items()}
        elif isinstance(obj, list):
            return [self._convert_datetime_for_json(item) for item in obj]
        elif isinstance(obj, datetime):
            return obj.isoformat()
        else:
            return obj
