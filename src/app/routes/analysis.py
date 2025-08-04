from flask import Blueprint, jsonify, request
import pandas as pd
import numpy as np
import json
from datetime import datetime, timedelta
import os

bp = Blueprint("analysis", __name__, url_prefix="/api/analysis")

# Data loading functions
def load_brent_data():
    """Load processed Brent oil data"""
    try:
        # Try multiple possible paths
        possible_paths = [
            "../../../data/processed/processed_brent_oil_data.csv",
            "../../data/processed/processed_brent_oil_data.csv",
            "../data/processed/processed_brent_oil_data.csv",
            "data/processed/processed_brent_oil_data.csv"
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                df = pd.read_csv(path)
                df['Date'] = pd.to_datetime(df['Date'])
                return df
        
        print("Brent oil data file not found in any expected location")
        return pd.DataFrame()
    except Exception as e:
        print(f"Error loading Brent data: {e}")
        return pd.DataFrame()

def load_events_data():
    """Load events dataset"""
    try:
        # Google Drive URL for events dataset
        url = "https://drive.google.com/uc?id=1bhEEL-xABTE1Y-MD6XLCRuswnPuXuUqB"
        
        df = pd.read_csv(url)
        # Handle different column names
        if 'date' in df.columns:
            df['Date'] = pd.to_datetime(df['date'])
        elif 'Date' in df.columns:
            df['Date'] = pd.to_datetime(df['Date'])
        return df
        
    except Exception as e:
        print(f"Error loading events data: {e}")
        return pd.DataFrame()

def load_analysis_results():
    """Load analysis results"""
    try:
        # Google Drive URL for analysis results
        url = "https://drive.google.com/uc?id=1Ucnd9Mi9d5wq8C4AJkKTrmSaAS10q-Qf"
        
        import requests
        response = requests.get(url)
        response.raise_for_status()
        return response.json()
        
    except Exception as e:
        print(f"Error loading analysis results: {e}")
        return {}

def generate_change_points_data():
    """Generate change points data from the Brent oil dataset"""
    try:
        df = load_brent_data()
        if df.empty:
            return []
        
        # Simple change point detection using rolling statistics
        # This is a simplified version - in production you'd use more sophisticated methods
        
        # Calculate rolling mean and std
        window_size = 30
        df['rolling_mean'] = df['Price'].rolling(window=window_size).mean()
        df['rolling_std'] = df['Price'].rolling(window=window_size).std()
        
        # Detect significant changes in rolling statistics
        change_points = []
        
        # Look for significant changes in rolling mean
        mean_change_threshold = df['Price'].std() * 0.5  # 50% of overall std
        
        for i in range(window_size + 1, len(df) - window_size):
            # Compare rolling means before and after current point
            before_mean = df['rolling_mean'].iloc[i-window_size:i].mean()
            after_mean = df['rolling_mean'].iloc[i:i+window_size].mean()
            
            if abs(after_mean - before_mean) > mean_change_threshold:
                change_point = {
                    'date': df['Date'].iloc[i].strftime('%Y-%m-%d'),
                    'confidence': 0.8,  # Mock confidence
                    'segment_start': df['Date'].iloc[i-window_size].strftime('%Y-%m-%d'),
                    'segment_end': df['Date'].iloc[i+window_size].strftime('%Y-%m-%d'),
                    'mean_before': float(before_mean),
                    'mean_after': float(after_mean),
                    'change_type': 'increase' if after_mean > before_mean else 'decrease'
                }
                change_points.append(change_point)
        
        # Limit to most significant changes (top 5)
        if len(change_points) > 5:
            change_points = sorted(change_points, key=lambda x: abs(x['mean_after'] - x['mean_before']), reverse=True)[:5]
        
        return change_points
        
    except Exception as e:
        print(f"Error generating change points data: {e}")
        return []

def generate_segments_data():
    """Generate segments data from the Brent oil dataset"""
    try:
        df = load_brent_data()
        if df.empty:
            return []
        
        # Create segments based on detected change points
        change_points = generate_change_points_data()
        segments = []
        
        if not change_points:
            # If no change points, create one segment for the entire period
            segments.append({
                'start_date': df['Date'].min().strftime('%Y-%m-%d'),
                'end_date': df['Date'].max().strftime('%Y-%m-%d'),
                'mean_price': float(df['Price'].mean()),
                'volatility': float(df['Price'].std() / df['Price'].mean()),
                'trend': 'stable'
            })
        else:
            # Create segments between change points
            start_date = df['Date'].min()
            
            for cp in change_points:
                cp_date = pd.to_datetime(cp['date'])
                
                # Segment before change point
                segment_data = df[df['Date'] < cp_date]
                if len(segment_data) > 0:
                    segments.append({
                        'start_date': start_date.strftime('%Y-%m-%d'),
                        'end_date': cp_date.strftime('%Y-%m-%d'),
                        'mean_price': float(segment_data['Price'].mean()),
                        'volatility': float(segment_data['Price'].std() / segment_data['Price'].mean()),
                        'trend': 'increasing' if cp['change_type'] == 'increase' else 'decreasing'
                    })
                
                start_date = cp_date
            
            # Final segment after last change point
            final_segment_data = df[df['Date'] >= start_date]
            if len(final_segment_data) > 0:
                segments.append({
                    'start_date': start_date.strftime('%Y-%m-%d'),
                    'end_date': df['Date'].max().strftime('%Y-%m-%d'),
                    'mean_price': float(final_segment_data['Price'].mean()),
                    'volatility': float(final_segment_data['Price'].std() / final_segment_data['Price'].mean()),
                    'trend': 'stable'
                })
        
        return segments
        
    except Exception as e:
        print(f"Error generating segments data: {e}")
        return []

@bp.route("/historical-data")
def historical_data():
    """Get historical Brent oil price data with optional date filtering"""
    df = load_brent_data()
    if df.empty:
        return jsonify({"error": "No data available"}), 500
    
    # Get query parameters
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    if start_date:
        df = df[df['Date'] >= start_date]
    if end_date:
        df = df[df['Date'] <= end_date]
    
    # Convert to format suitable for charts
    data = df[['Date', 'Price']].copy()
    data['Date'] = data['Date'].dt.strftime('%Y-%m-%d')
    
    return jsonify({
        "data": data.to_dict(orient="records"),
        "summary": {
            "total_records": len(data),
            "date_range": {
                "start": data['Date'].min(),
                "end": data['Date'].max()
            },
            "price_stats": {
                "min": float(data['Price'].min()),
                "max": float(data['Price'].max()),
                "avg": float(data['Price'].mean()),
                "current": float(data['Price'].iloc[-1]) if len(data) > 0 else None
            }
        }
    })

@bp.route("/events")
def events():
    """Get events data with optional filtering"""
    df = load_events_data()
    if df.empty:
        return jsonify({"error": "No events data available"}), 500
    
    # Get query parameters
    event_type = request.args.get('event_type')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    # Handle different column names
    event_type_col = 'Event_Type' if 'Event_Type' in df.columns else 'category'
    description_col = 'Description' if 'Description' in df.columns else 'event'
    
    if event_type:
        df = df[df[event_type_col].str.contains(event_type, case=False, na=False)]
    if start_date:
        df = df[df['Date'] >= start_date]
    if end_date:
        df = df[df['Date'] <= end_date]
    
    # Standardize column names for frontend
    df['Date'] = df['Date'].dt.strftime('%Y-%m-%d')
    df['Event_Type'] = df[event_type_col]
    df['Description'] = df[description_col]
    
    return jsonify({
        "events": df.to_dict(orient="records"),
        "event_types": df[event_type_col].unique().tolist()
    })

@bp.route("/change-points")
def change_points():
    """Get change point analysis results"""
    # Generate change points data dynamically
    change_points_data = generate_change_points_data()
    segments_data = generate_segments_data()
    
    # Create model performance metrics
    model_performance = {
        "accuracy": 0.85,  # Mock accuracy
        "precision": 0.82,
        "recall": 0.88,
        "f1_score": 0.85
    }
    
    return jsonify({
        "change_points": change_points_data,
        "segments": segments_data,
        "model_performance": model_performance
    })

@bp.route("/volatility-analysis")
def volatility_analysis():
    """Calculate and return volatility metrics"""
    df = load_brent_data()
    if df.empty:
        return jsonify({"error": "No data available"}), 500
    
    # Calculate daily returns
    df['Returns'] = df['Price'].pct_change()
    
    # Calculate rolling volatility (30-day window)
    df['Volatility_30d'] = df['Returns'].rolling(window=30).std() * np.sqrt(252)
    
    # Calculate volatility around events
    events_df = load_events_data()
    event_volatility = []
    
    for _, event in events_df.iterrows():
        event_date = pd.to_datetime(event['Date'])
        # Get 30 days before and after event
        start_date = event_date - timedelta(days=30)
        end_date = event_date + timedelta(days=30)
        
        event_data = df[(df['Date'] >= start_date) & (df['Date'] <= end_date)]
        if len(event_data) > 0:
            pre_event_vol = event_data[event_data['Date'] < event_date]['Returns'].std() * np.sqrt(252)
            post_event_vol = event_data[event_data['Date'] > event_date]['Returns'].std() * np.sqrt(252)
            
            # Handle different column names
            event_type = event.get('Event_Type', event.get('category', 'Unknown'))
            description = event.get('Description', event.get('event', 'No description'))
            
            event_volatility.append({
                "event_date": event_date.strftime('%Y-%m-%d'),
                "event_type": event_type,
                "description": description,
                "pre_event_volatility": float(pre_event_vol) if not np.isnan(pre_event_vol) else None,
                "post_event_volatility": float(post_event_vol) if not np.isnan(post_event_vol) else None,
                "volatility_change": float(post_event_vol - pre_event_vol) if not (np.isnan(pre_event_vol) or np.isnan(post_event_vol)) else None
            })
    
    # Prepare volatility data for charts
    volatility_data = df[['Date', 'Volatility_30d']].dropna()
    volatility_data['Date'] = volatility_data['Date'].dt.strftime('%Y-%m-%d')
    
    return jsonify({
        "volatility_trend": volatility_data.to_dict(orient="records"),
        "event_volatility": event_volatility,
        "summary": {
            "avg_volatility": float(df['Volatility_30d'].mean()),
            "max_volatility": float(df['Volatility_30d'].max()),
            "min_volatility": float(df['Volatility_30d'].min())
        }
    })

@bp.route("/correlation-analysis")
def correlation_analysis():
    """Analyze correlations between events and price movements"""
    df = load_brent_data()
    events_df = load_events_data()
    
    if df.empty or events_df.empty:
        return jsonify({"error": "Insufficient data for correlation analysis"}), 500
    
    correlations = []
    
    for _, event in events_df.iterrows():
        event_date = pd.to_datetime(event['Date'])
        
        # Get price data around event (±30 days)
        start_date = event_date - timedelta(days=30)
        end_date = event_date + timedelta(days=30)
        
        event_data = df[(df['Date'] >= start_date) & (df['Date'] <= end_date)]
        
        if len(event_data) > 10:  # Need sufficient data points
            pre_event_avg = event_data[event_data['Date'] < event_date]['Price'].mean()
            post_event_avg = event_data[event_data['Date'] > event_date]['Price'].mean()
            
            price_change = ((post_event_avg - pre_event_avg) / pre_event_avg) * 100 if pre_event_avg > 0 else 0
            
            # Handle different column names
            event_type = event.get('Event_Type', event.get('category', 'Unknown'))
            description = event.get('Description', event.get('event', 'No description'))
            
            correlations.append({
                "event_date": event_date.strftime('%Y-%m-%d'),
                "event_type": event_type,
                "description": description,
                "price_change_percent": float(price_change),
                "pre_event_avg_price": float(pre_event_avg),
                "post_event_avg_price": float(post_event_avg),
                "impact_magnitude": abs(price_change)
            })
    
    # Sort by impact magnitude
    correlations.sort(key=lambda x: x['impact_magnitude'], reverse=True)
    
    return jsonify({
        "correlations": correlations,
        "summary": {
            "total_events_analyzed": len(correlations),
            "avg_price_change": np.mean([c['price_change_percent'] for c in correlations]) if correlations else 0,
            "max_impact_event": correlations[0] if correlations else None
        }
    })

@bp.route("/forecast")
def forecast():
    """Get forecast data if available"""
    results = load_analysis_results()
    
    return jsonify({
        "forecast": results.get("forecast", {}),
        "forecast_accuracy": results.get("forecast_accuracy", {}),
        "confidence_intervals": results.get("confidence_intervals", [])
    })

@bp.route("/dashboard-summary")
def dashboard_summary():
    """Get comprehensive dashboard summary"""
    df = load_brent_data()
    events_df = load_events_data()
    results = load_analysis_results()
    
    if df.empty:
        return jsonify({"error": "No data available"}), 500
    
    # Calculate key metrics
    current_price = float(df['Price'].iloc[-1])
    current_date = df['Date'].iloc[-1]
    
    # Calculate 1 day change
    price_change_1d = float(df['Price'].pct_change().iloc[-1] * 100) if len(df) > 1 else 0
    
    # Calculate 1 week change (7 days ago)
    week_ago_date = current_date - timedelta(days=7)
    week_ago_data = df[df['Date'] <= week_ago_date]
    if len(week_ago_data) > 0:
        week_ago_price = week_ago_data['Price'].iloc[-1]
        price_change_1w = float(((current_price / week_ago_price) - 1) * 100)
    else:
        price_change_1w = 0
    
    # Calculate 1 month change (30 days ago)
    month_ago_date = current_date - timedelta(days=30)
    month_ago_data = df[df['Date'] <= month_ago_date]
    if len(month_ago_data) > 0:
        month_ago_price = month_ago_data['Price'].iloc[-1]
        price_change_1m = float(((current_price / month_ago_price) - 1) * 100)
    else:
        price_change_1m = 0
    
    return jsonify({
        "current_price": current_price,
        "price_changes": {
            "1d": price_change_1d,
            "1w": price_change_1w,
            "1m": price_change_1m
        },
        "statistics": {
            "total_data_points": len(df),
            "date_range": {
                "start": df['Date'].min().strftime('%Y-%m-%d'),
                "end": df['Date'].max().strftime('%Y-%m-%d')
            },
            "price_range": {
                "min": float(df['Price'].min()),
                "max": float(df['Price'].max()),
                "avg": float(df['Price'].mean())
            }
        },
        "events_summary": {
            "total_events": len(events_df),
            "event_types": events_df.get('Event_Type', events_df.get('category', pd.Series())).value_counts().to_dict() if not events_df.empty else {}
        },
        "analysis_status": {
            "change_points_detected": len(results.get("change_points", [])),
            "model_performance": results.get("model_performance", {})
        }
    })

@bp.route("/trend")
def price_trend():
    """Legacy endpoint for backward compatibility"""
    return historical_data()

@bp.route("/volatility")
def volatility():
    """Legacy endpoint for backward compatibility"""
    return volatility_analysis()
