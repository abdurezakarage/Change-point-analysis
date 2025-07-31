# Brent Oil Price Analysis - Birhan Energies

## Project Overview

This project analyzes how important geopolitical and economic events affect Brent oil prices. The analysis focuses on identifying structural changes in oil price dynamics and correlating them with major events such as political decisions, conflicts in oil-producing regions, global economic sanctions, and OPEC policy changes.

## Business Objective

The main goal is to provide clear insights that help investors, analysts, and policymakers understand and react to oil price changes better. This analysis supports:

- **Investment Strategy Development**: Understanding price volatility patterns and event impacts
- **Risk Management**: Identifying periods of high volatility and structural changes
- **Policy Development**: Informing energy security and economic stability strategies
- **Operational Planning**: Helping energy companies adapt to market conditions

## Data

The dataset contains historical Brent oil prices from May 20, 1987, to September 30, 2022, with daily price observations in USD per barrel.

### Data Fields
- **Date**: Date of the recorded Brent oil price (format: day-month-year)
- **Price**: Brent oil price in USD per barrel

## Analysis Workflow

### 1. Data Analysis Workflow

The analysis follows a structured approach:

1. **Data Loading and Preprocessing**
   - Load historical Brent oil price data
   - Convert dates and calculate derived features
   - Handle missing values and outliers

2. **Time Series Properties Analysis**
   - Stationarity testing (Augmented Dickey-Fuller test)
   - Trend analysis (linear and exponential)
   - Seasonality analysis (monthly and weekly patterns)
   - Volatility clustering analysis

3. **Change Point Detection**
   - Use ruptures library for structural break detection
   - Alternative peak detection method for validation
   - Analyze change point characteristics and intervals

4. **Event Correlation Analysis**
   - Compile major geopolitical and economic events
   - Analyze price impacts around event dates
   - Statistical testing of event significance
   - Match change points with nearby events

5. **Insights Generation**
   - Executive summary for stakeholders
   - Key findings and risk assessment
   - Recommendations for different stakeholder groups
   - Documentation of limitations and assumptions

### 2. Key Concepts and Models

#### Change Point Models
Change point models identify structural breaks in time series data where the underlying parameters (mean, variance, trend) change significantly. In the context of oil prices:

- **Purpose**: Detect when oil price dynamics fundamentally change
- **Applications**: Identify regime changes, policy impacts, market structure shifts
- **Outputs**: Dates of structural changes, new parameter values, confidence intervals
- **Limitations**: Cannot prove causation, may miss gradual changes

#### Statistical Methods Used
- **Augmented Dickey-Fuller Test**: Tests for stationarity
- **Linear Regression**: Analyzes trends and correlations
- **Autocorrelation Analysis**: Identifies volatility clustering
- **T-Tests**: Validates statistical significance of event impacts
- **Peak Detection**: Alternative method for change point identification

### 3. Assumptions and Limitations

#### Key Assumptions
1. **Event Selection**: Major geopolitical and economic events significantly impact oil prices
2. **Time Window**: 30-day windows around events capture relevant price impacts
3. **Structural Changes**: Detected change points represent meaningful regime shifts
4. **Historical Patterns**: Past behavior provides insights for future planning

#### Important Limitations
1. **Correlation vs. Causation**: Statistical correlation does not prove causal relationships
2. **Event Completeness**: Event selection is subjective and may miss important events
3. **Market Evolution**: Historical patterns may not predict future behavior
4. **Benchmark Specificity**: Analysis focuses on Brent oil prices specifically
5. **Time Series Assumptions**: Assumes past patterns continue into the future

## Installation and Setup

### Prerequisites
- Python 3.8 or higher
- pip package manager

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Change-point-analysis
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

## Usage

### Running the Complete Analysis

```bash
cd src
python price_analyzer.py
```

This will:
1. Load and preprocess the Brent oil price data
2. Analyze time series properties
3. Detect structural change points
4. Correlate events with price changes
5. Generate comprehensive insights report
6. Save results to `data/processed/`

### Using the Analyzer Class

```python
from price_analyzer import BrentOilPriceAnalyzer

# Initialize analyzer
analyzer = BrentOilPriceAnalyzer()

# Run specific analyses
analyzer.analyze_time_series_properties()
analyzer.detect_change_points(method='ruptures', n_bkps=15)
analyzer.correlate_events_with_changes(window_days=30)

# Generate insights
insights = analyzer.generate_insights_report()

# Save results
analyzer.save_results()
```

## Output Files

The analysis generates several output files in the `data/processed/` directory:

- **processed_brent_oil_data.csv**: Preprocessed price data with derived features
- **event_dataset.csv**: Compiled major events dataset
- **change_points.csv**: Detected structural change points
- **analysis_results.json**: Complete analysis results in JSON format

## Key Findings

### Time Series Properties
- Brent oil prices exhibit non-stationary behavior with persistent trends
- Significant volatility clustering indicates periods of high and low volatility
- Price movements show autocorrelation in squared returns (GARCH effects)

### Change Point Analysis
- Multiple structural breaks detected over the 35-year period
- Change points often coincide with major geopolitical or economic events
- Average intervals between change points provide insights into market stability

### Event Impact Analysis
- Geopolitical events, particularly in oil-producing regions, show significant price impacts
- Economic crises and policy changes also affect price dynamics
- Statistical tests confirm the significance of event impacts on oil prices

## Recommendations

### For Investors
1. Implement dynamic hedging strategies that adjust to volatility regimes
2. Monitor geopolitical events in oil-producing regions closely
3. Diversify energy portfolios to reduce exposure to oil price volatility
4. Use change point analysis for portfolio rebalancing decisions

### For Policymakers
1. Develop strategic petroleum reserves to buffer against supply shocks
2. Implement policies that reduce dependence on oil imports
3. Monitor and respond to geopolitical developments in key oil regions
4. Consider oil price volatility in economic planning and forecasting

### For Energy Companies
1. Implement flexible pricing strategies that adapt to market conditions
2. Develop scenario planning based on historical event impacts
3. Invest in technologies that reduce operational costs during price volatility
4. Strengthen supply chain resilience against geopolitical disruptions

## Communication Channels

### Primary Media Channels
- **Executive Reports**: Comprehensive PDF reports for senior stakeholders
- **Interactive Dashboards**: Web-based visualizations for analysts
- **Data Exports**: CSV and JSON files for further analysis
- **Presentations**: PowerPoint slides for stakeholder meetings

### Formats
- **Executive Summary**: High-level insights for decision-makers
- **Technical Reports**: Detailed methodology and statistical results
- **Visualizations**: Charts, graphs, and interactive plots
- **Recommendations**: Actionable insights for different stakeholder groups

## Contributing

To contribute to this project:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For questions or support, contact the Birhan Energies Data Science Team.

---

**Note**: This analysis is for educational and research purposes. Investment decisions should be based on comprehensive analysis and professional advice.