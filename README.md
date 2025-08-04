# Brent Oil Price Analysis

## Project Overview
This project analyzes how important geopolitical and economic events affect Brent oil prices. The analysis focuses on identifying structural changes in oil price dynamics and correlating them with major events such as political decisions, conflicts in oil-producing regions, global economic sanctions, and OPEC policy changes.

A comprehensive interactive dashboard for analyzing Brent oil price trends and correlations with historical events. This project combines advanced data analysis with an intuitive web interface to help stakeholders understand how various events affect oil prices.

## Project Organization
This repository follows a well-structured organization to ensure clarity, maintainability, and reproducibility of the analysis:

### 📁 Folder Structure
```
Change-point-analysis/
├── 📊 data/                    # Data storage and management
│   ├── raw/                   # Original, unprocessed data files
│   ├── processed/             # Cleaned and processed datasets
├── 📓 notebooks/              # Jupyter notebooks for analysis
│   ├── changePoint.ipynb      # Change point detection analysis
│   ├── price_analyzer.ipynb   # Comprehensive price analysis
│   └── __init__.py           # Python package initialization
├── 🔧 src/                    # Source code and utilities
│   ├── changePoint.py        # Change point detection functions
│   ├── price_analyzer.py     # Price analysis utilities
│   └── __init__.py           # Python package initialization
├── 🐍 venv/                   # Python virtual environment
├── 📋 requirements.txt        # Python dependencies
└── 📖 README.md              # Project documentation
```

### 📋 File Descriptions
- **Data Directory (data/)**
  - `raw/`: Contains the original Brent oil price dataset and any external data sources
  - `processed/`: Stores cleaned, transformed, and feature-engineered datasets ready for analysis

- **Notebooks Directory (notebooks/)**
  - `changePoint.ipynb`: Comprehensive change point detection analysis using the ruptures library
  - `price_analyzer.ipynb`: Detailed price analysis including time series properties and event correlation
  - `__init__.py`: Enables notebooks directory as a Python package

- **Source Code Directory (src/)**
  - `changePoint.py`: Modular functions for change point detection algorithms
  - `price_analyzer.py`: Utility functions for data preprocessing, analysis, and visualization
  - `__init__.py`: Package initialization for importing modules

### Configuration Files
- `requirements.txt`: Lists all Python dependencies with specific versions for reproducibility
- `README.md`: Comprehensive project documentation (this file)

### 🔄 Workflow Organization
The project follows a logical workflow:
1. **Data Ingestion** → `data/raw/` → Original datasets
2. **Data Processing** → `src/` → Clean and transform data
3. **Analysis** → `notebooks/` → Interactive analysis and exploration
4. **Results** → `data/outputs/` → Generated insights and visualizations
5. **Documentation** → `docs/` → Reports and findings

### 🛠️ Development Setup
- **Environment**: Use the provided `venv/` virtual environment
- **Dependencies**: Install via `pip install -r requirements.txt`
- **Analysis**: Run notebooks in order: `price_analyzer.ipynb` → `changePoint.ipynb`
- **Reproducibility**: All analysis steps are documented and version-controlled

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

#### Data Loading and Preprocessing
- Load historical Brent oil price data
- Convert dates and calculate derived features
- Handle missing values and outliers

#### Time Series Properties Analysis
- Stationarity testing (Augmented Dickey-Fuller test)
- Trend analysis (linear and exponential)
- Seasonality analysis (monthly and weekly patterns)
- Volatility clustering analysis

#### Change Point Detection
- Use ruptures library for structural break detection
- Alternative peak detection method for validation
- Analyze change point characteristics and intervals

#### Event Correlation Analysis
- Compile major geopolitical and economic events
- Analyze price impacts around event dates
- Statistical testing of event significance
- Match change points with nearby events

#### Insights Generation
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

### 3. Assumptions and Limitations

#### Key Assumptions
- **Event Selection**: Major geopolitical and economic events significantly impact oil prices
- **Time Window**: 30-day windows around events capture relevant price impacts
- **Structural Changes**: Detected change points represent meaningful regime shifts
- **Historical Patterns**: Past behavior provides insights for future planning

#### Important Limitations
- **Correlation vs. Causation**: Statistical correlation does not prove causal relationships
- **Event Completeness**: Event selection is subjective and may miss important events
- **Market Evolution**: Historical patterns may not predict future behavior
- **Benchmark Specificity**: Analysis focuses on Brent oil prices specifically
- **Time Series Assumptions**: Assumes past patterns continue into the future

### Output Files
The analysis generates several output files in the `data/processed/` directory:

- `processed_brent_oil_data.csv`: Preprocessed price data with derived features
- `event_dataset.csv`: Compiled major events dataset
- `change_points.csv`: Detected structural change points
- `analysis_results.json`: Complete analysis results in JSON format

### Key Findings

#### Time Series Properties
- Brent oil prices exhibit non-stationary behavior with persistent trends
- Significant volatility clustering indicates periods of high and low volatility
- Price movements show autocorrelation in squared returns (GARCH effects)

#### Change Point Analysis
- Multiple structural breaks detected over the 35-year period
- Change points often coincide with major geopolitical or economic events
- Average intervals between change points provide insights into market stability

#### Event Impact Analysis
- Geopolitical events, particularly in oil-producing regions, show significant price impacts
- Economic crises and policy changes also affect price dynamics
- Statistical tests confirm the significance of event impacts on oil prices

## 🚀 Features

### Backend (Flask)
- **RESTful API** with comprehensive endpoints for data analysis
- **Real-time data processing** with pandas and numpy
- **Advanced analytics** including volatility analysis, correlation analysis, and change point detection
- **CORS support** for seamless frontend integration
- **Error handling** and data validation

### Frontend (Next.js)
- **Interactive visualizations** using Recharts
- **Responsive design** with Tailwind CSS
- **Real-time data filtering** and date range selection
- **Event timeline** with impact analysis
- **Change point detection** visualization
- **Correlation analysis** charts and tables

### Key Analytics Features
- **Historical Price Trends** with interactive charts
- **Volatility Analysis** with 30-day rolling windows
- **Event Impact Analysis** showing price changes around key events
- **Change Point Detection** identifying structural breaks in price data
- **Correlation Analysis** between events and price movements
- **Comprehensive Filtering** by date ranges and event types

## 📊 Dashboard Components

1. **Price Trend Analysis** - Interactive line charts showing historical price movements
2. **Volatility Analysis** - Rolling volatility calculations and event impact visualization
3. **Events Timeline** - Chronological display of key events with impact indicators
4. **Change Points Analysis** - Detection and visualization of structural breaks
5. **Event Impact Analysis** - Correlation between events and price changes
6. **Filter Panel** - Date range and event type filtering capabilities

## 🛠️ Technology Stack

### Backend
- **Flask** - Web framework
- **Pandas** - Data manipulation and analysis
- **NumPy** - Numerical computations
- **Flask-CORS** - Cross-origin resource sharing

### Frontend
- **Next.js 15** - React framework
- **React 18** - UI library
- **Recharts** - Charting library
- **Tailwind CSS** - Styling framework
- **Lucide React** - Icon library
- **Axios** - HTTP client

## 📁 Project Structure

```
Change-point-analysis/
├── data/
│   ├── processed/
│   │   ├── processed_brent_oil_data.csv
│   │   ├── event_dataset.csv
│   │   └── analysis_results.json
│   └── raw/
├── src/
│   ├── app/
│   │   ├── app.py                 # Flask application
│   │   └── routes/
│   │       └── analysis.py        # API endpoints
│   └── Dashboared/
│       └── brent_oil_dashboared/  # Next.js frontend
│           ├── app/
│           │   ├── page.tsx       # Main dashboard
│           │   ├── layout.tsx     # App layout
│           │   └── components/    # React components
│           │       ├── PriceChart.tsx
│           │       ├── VolatilityChart.tsx
│           │       ├── EventsTimeline.tsx
│           │       ├── CorrelationAnalysis.tsx
│           │       ├── ChangePointsAnalysis.tsx
│           │       ├── FilterPanel.tsx
│           │       └── LoadingSpinner.tsx
│           ├── package.json
│           └── next.config.ts
├── requirements.txt
└── README.md
``

