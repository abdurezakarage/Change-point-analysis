# Brent Oil Analysis Dashboard

A comprehensive interactive dashboard for analyzing Brent oil price trends and correlations with historical events. This project combines advanced data analysis with an intuitive web interface to help stakeholders understand how various events affect oil prices.

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
```

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 18+
- npm or yarn

### Backend Setup

1. **Navigate to the project directory:**
   ```bash
   cd Change-point-analysis
   ```

2. **Create and activate virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the Flask backend:**
   ```bash
   cd src/app
   python app.py
   ```
   The backend will be available at `http://localhost:5000`

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd src/Dashboared/brent_oil_dashboared
   ```

2. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:3000`

## 📡 API Endpoints

### Core Endpoints
- `GET /api/analysis/dashboard-summary` - Comprehensive dashboard summary
- `GET /api/analysis/historical-data` - Historical price data with filtering
- `GET /api/analysis/events` - Events data with filtering
- `GET /api/analysis/volatility-analysis` - Volatility calculations and analysis
- `GET /api/analysis/correlation-analysis` - Event-price correlation analysis
- `GET /api/analysis/change-points` - Change point detection results
- `GET /api/analysis/forecast` - Forecasting data (if available)

### Query Parameters
- `start_date` - Filter data from this date (YYYY-MM-DD)
- `end_date` - Filter data until this date (YYYY-MM-DD)
- `event_type` - Filter by specific event type

## 🎯 Key Features

### Interactive Visualizations
- **Price Trend Charts** - Real-time price data with zoom and pan capabilities
- **Volatility Analysis** - Rolling volatility with event impact overlays
- **Event Timeline** - Chronological event display with impact indicators
- **Correlation Charts** - Bar charts and scatter plots showing event impacts
- **Change Point Visualization** - Structural break detection and analysis

### Data Filtering
- **Date Range Selection** - Filter data by specific time periods
- **Event Type Filtering** - Focus on specific types of events
- **Real-time Updates** - Charts update automatically with filter changes

### Responsive Design
- **Mobile-friendly** - Optimized for tablets and mobile devices
- **Desktop Optimized** - Full-featured experience on larger screens
- **Cross-browser Compatible** - Works on all modern browsers

## 📈 Analytics Capabilities

### Price Analysis
- Historical price trends and patterns
- Price change calculations (1d, 1w, 1m)
- Statistical summaries (min, max, average, current)

### Volatility Analysis
- 30-day rolling volatility calculations
- Pre/post event volatility comparisons
- Volatility trend visualization

### Event Impact Analysis
- Price change calculations around events
- Impact magnitude ranking
- Correlation analysis between events and price movements

### Change Point Detection
- Structural break identification
- Confidence level calculations
- Segment analysis and trend identification

## 🔧 Configuration

### Environment Variables
- `PORT` - Backend port (default: 5000)
- `FLASK_DEBUG` - Debug mode (default: True)

### Data Sources
The dashboard expects the following data files in `data/processed/`:
- `processed_brent_oil_data.csv` - Historical Brent oil price data
- `event_dataset.csv` - Events dataset with dates and descriptions
- `analysis_results.json` - Pre-computed analysis results

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Brent oil price data sources
- Event dataset contributors
- Open-source libraries and frameworks used in this project

## 📞 Support

For support and questions, please open an issue in the repository or contact the development team.

---

**Note:** Make sure both the Flask backend and Next.js frontend are running simultaneously for the dashboard to function properly.
