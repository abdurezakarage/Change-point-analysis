#!/usr/bin/env python3
"""
Test script for Brent Oil Price Analyzer
========================================

This script tests the basic functionality of the price analyzer.
"""

import sys
import os

# Add src directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

try:
    from price_analyzer import BrentOilPriceAnalyzer
    print("✓ Successfully imported BrentOilPriceAnalyzer")
except ImportError as e:
    print(f"✗ Failed to import BrentOilPriceAnalyzer: {e}")
    sys.exit(1)

def test_basic_functionality():
    """Test basic functionality of the analyzer."""
    print("\n=== Testing Basic Functionality ===")
    
    try:
        # Initialize analyzer
        print("Initializing analyzer...")
        analyzer = BrentOilPriceAnalyzer()
        print("✓ Analyzer initialized successfully")
        
        # Test data loading
        print(f"✓ Data loaded: {len(analyzer.processed_data)} records")
        print(f"✓ Date range: {analyzer.processed_data['Date'].min()} to {analyzer.processed_data['Date'].max()}")
        
        # Test time series analysis
        print("\nRunning time series analysis...")
        ts_results = analyzer.analyze_time_series_properties()
        print("✓ Time series analysis completed")
        
        # Test change point detection
        print("\nRunning change point detection...")
        cp_results = analyzer.detect_change_points(method='ruptures', n_bkps=5)
        print("✓ Change point detection completed")
        
        # Test event correlation
        print("\nRunning event correlation analysis...")
        event_results = analyzer.correlate_events_with_changes(window_days=30)
        print("✓ Event correlation analysis completed")
        
        # Test insights generation
        print("\nGenerating insights report...")
        insights = analyzer.generate_insights_report()
        print("✓ Insights report generated")
        
        # Test saving results
        print("\nSaving results...")
        analyzer.save_results()
        print("✓ Results saved successfully")
        
        print("\n=== All Tests Passed! ===")
        return True
        
    except Exception as e:
        print(f"✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_data_quality():
    """Test data quality and basic statistics."""
    print("\n=== Testing Data Quality ===")
    
    try:
        analyzer = BrentOilPriceAnalyzer()
        
        # Check for missing values
        missing_values = analyzer.processed_data.isnull().sum()
        print(f"Missing values:\n{missing_values}")
        
        # Check basic statistics
        print(f"\nPrice statistics:")
        print(f"Mean: ${analyzer.processed_data['Price'].mean():.2f}")
        print(f"Std: ${analyzer.processed_data['Price'].std():.2f}")
        print(f"Min: ${analyzer.processed_data['Price'].min():.2f}")
        print(f"Max: ${analyzer.processed_data['Price'].max():.2f}")
        
        # Check date range
        date_range = analyzer.processed_data['Date'].max() - analyzer.processed_data['Date'].min()
        print(f"Date range: {date_range.days} days ({date_range.days/365.25:.1f} years)")
        
        print("✓ Data quality check completed")
        return True
        
    except Exception as e:
        print(f"✗ Data quality test failed: {e}")
        return False

if __name__ == "__main__":
    print("=== Brent Oil Price Analyzer Test Suite ===\n")
    
    # Run tests
    test1_passed = test_basic_functionality()
    test2_passed = test_data_quality()
    
    # Summary
    print("\n" + "="*50)
    print("TEST SUMMARY")
    print("="*50)
    print(f"Basic Functionality: {'✓ PASSED' if test1_passed else '✗ FAILED'}")
    print(f"Data Quality: {'✓ PASSED' if test2_passed else '✗ FAILED'}")
    
    if test1_passed and test2_passed:
        print("\n🎉 All tests passed! The analyzer is working correctly.")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed. Please check the error messages above.")
        sys.exit(1) 