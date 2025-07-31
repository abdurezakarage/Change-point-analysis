

import sys
import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import warnings

warnings.filterwarnings('ignore')

def test_data_loading():
    """Test basic data loading functionality."""
    print("=== Testing Data Loading ===")
    
    try:
        # Load data
        data_path = "data/raw/BrentOilPrices.csv"
        data = pd.read_csv(data_path)
        print(f"✓ Data loaded successfully: {len(data)} records")
        print(f"✓ Date range: {data['Date'].min()} to {data['Date'].max()}")
        
        # Basic preprocessing
        data['Date'] = pd.to_datetime(data['Date'], format='%d-%b-%y')
        data = data.sort_values('Date').reset_index(drop=True)
        
        # Add basic features
        data['Year'] = data['Date'].dt.year
        data['Month'] = data['Date'].dt.month
        data['Price_Change'] = data['Price'].diff()
        data['Price_Change_Pct'] = data['Price'].pct_change() * 100
        
        print(f"✓ Data preprocessing completed")
        print(f"✓ Price range: ${data['Price'].min():.2f} - ${data['Price'].max():.2f}")
        print(f"✓ Mean price: ${data['Price'].mean():.2f}")
        
        return True, data
        
    except Exception as e:
        print(f"✗ Data loading failed: {e}")
        return False, None

def test_basic_analysis(data):
    """Test basic statistical analysis."""
    print("\n=== Testing Basic Analysis ===")
    
    try:
        # Basic statistics
        basic_stats = {
            'mean_price': data['Price'].mean(),
            'std_price': data['Price'].std(),
            'min_price': data['Price'].min(),
            'max_price': data['Price'].max(),
            'total_observations': len(data),
            'date_range_years': (data['Date'].max() - data['Date'].min()).days / 365.25
        }
        
        print(f"✓ Basic statistics calculated")
        print(f"  - Mean Price: ${basic_stats['mean_price']:.2f}")
        print(f"  - Price Range: ${basic_stats['min_price']:.2f} - ${basic_stats['max_price']:.2f}")
        print(f"  - Data Span: {basic_stats['date_range_years']:.1f} years")
        
        # Volatility analysis
        returns = data['Price_Change_Pct'].dropna()
        high_vol_threshold = returns.quantile(0.9)
        low_vol_threshold = returns.quantile(0.1)
        
        high_vol_periods = (returns > high_vol_threshold).sum()
        low_vol_periods = (returns < low_vol_threshold).sum()
        
        print(f"✓ Volatility analysis completed")
        print(f"  - High volatility periods: {high_vol_periods}")
        print(f"  - Low volatility periods: {low_vol_periods}")
        
        return True
        
    except Exception as e:
        print(f"✗ Basic analysis failed: {e}")
        return False

def test_event_analysis(data):
    """Test event-based analysis."""
    print("\n=== Testing Event Analysis ===")
    
    try:
        # Create simple event dataset
        events = [
            {'date': '1990-08-02', 'event': 'Iraq invades Kuwait', 'category': 'conflict'},
            {'date': '2001-09-11', 'event': '9/11 terrorist attacks', 'category': 'geopolitical'},
            {'date': '2008-09-15', 'event': 'Lehman Brothers bankruptcy', 'category': 'economic'},
            {'date': '2020-03-11', 'event': 'WHO declares COVID-19 pandemic', 'category': 'economic'},
            {'date': '2022-02-24', 'event': 'Russia invades Ukraine', 'category': 'conflict'},
        ]
        
        event_data = pd.DataFrame(events)
        event_data['date'] = pd.to_datetime(event_data['date'])
        
        print(f"✓ Event dataset created with {len(event_data)} events")
        
        # Analyze one event impact
        event_date = pd.to_datetime('2008-09-15')
        window_days = 30
        
        start_date = event_date - timedelta(days=window_days)
        end_date = event_date + timedelta(days=window_days)
        
        event_window = data[
            (data['Date'] >= start_date) & 
            (data['Date'] <= end_date)
        ].copy()
        
        if len(event_window) > 0:
            pre_event = event_window[event_window['Date'] < event_date]
            post_event = event_window[event_window['Date'] >= event_date]
            
            if len(pre_event) > 0 and len(post_event) > 0:
                pre_mean = pre_event['Price'].mean()
                post_mean = post_event['Price'].mean()
                price_change = ((post_mean - pre_mean) / pre_mean) * 100
                
                print(f"✓ Event impact analysis completed")
                print(f"  - Lehman Brothers bankruptcy impact: {price_change:.1f}%")
        
        return True
        
    except Exception as e:
        print(f"✗ Event analysis failed: {e}")
        return False

def test_peak_detection(data):
    """Test peak detection for change points."""
    print("\n=== Testing Peak Detection ===")
    
    try:
        from scipy.signal import find_peaks
        
        # Find peaks in absolute price changes
        price_changes = np.abs(data['Price_Change'].values)
        peaks, _ = find_peaks(price_changes, height=np.percentile(price_changes, 95))
        
        print(f"✓ Peak detection completed")
        print(f"  - Detected {len(peaks)} significant price change peaks")
        
        if len(peaks) > 0:
            # Show top 5 peaks
            peak_magnitudes = price_changes[peaks]
            top_peaks_idx = np.argsort(peak_magnitudes)[-5:]
            
            print(f"  - Top 5 peak dates:")
            for i, peak_idx in enumerate(peaks[top_peaks_idx]):
                date = data.iloc[peak_idx]['Date']
                magnitude = price_changes[peak_idx]
                print(f"    {i+1}. {date.strftime('%Y-%m-%d')}: ${magnitude:.2f}")
        
        return True
        
    except Exception as e:
        print(f"✗ Peak detection failed: {e}")
        return False

def main():
    """Main test function."""
    print("=== Brent Oil Price Analyzer - Simple Test Suite ===\n")
    
    # Test 1: Data loading
    success1, data = test_data_loading()
    
    if not success1:
        print("\n❌ Data loading failed. Cannot proceed with other tests.")
        sys.exit(1)
    
    # Test 2: Basic analysis
    success2 = test_basic_analysis(data)
    
    # Test 3: Event analysis
    success3 = test_event_analysis(data)
    
    # Test 4: Peak detection
    success4 = test_peak_detection(data)
    
    # Summary
    print("\n" + "="*50)
    print("TEST SUMMARY")
    print("="*50)
    print(f"Data Loading: {'✓ PASSED' if success1 else '✗ FAILED'}")
    print(f"Basic Analysis: {'✓ PASSED' if success2 else '✗ FAILED'}")
    print(f"Event Analysis: {'✓ PASSED' if success3 else '✗ FAILED'}")
    print(f"Peak Detection: {'✓ PASSED' if success4 else '✗ FAILED'}")
    
    passed_tests = sum([success1, success2, success3, success4])
    total_tests = 4
    
    if passed_tests == total_tests:
        print(f"\n🎉 All {total_tests} tests passed! The basic functionality is working.")
        print("\nNext steps:")
        print("1. Install Microsoft C++ Build Tools to use the full version with ruptures")
        print("2. Or use the simplified version without ruptures")
        sys.exit(0)
    else:
        print(f"\n❌ {total_tests - passed_tests} out of {total_tests} tests failed.")
        print("Please check the error messages above.")
        sys.exit(1)

if __name__ == "__main__":
    main() 