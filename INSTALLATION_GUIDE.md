# Installation Guide - Brent Oil Price Analysis

## Issue Resolution

If you encountered the error "Microsoft Visual C++ 14.0 or greater is required" when installing the `ruptures` library, here are several solutions:

## Solution 1: Install Microsoft C++ Build Tools (Recommended)

### Step 1: Download Build Tools
1. Go to: https://visualstudio.microsoft.com/visual-cpp-build-tools/
2. Click "Download Build Tools"
3. Run the installer

### Step 2: Install C++ Components
1. In the installer, select "C++ build tools" workload
2. Click "Install"
3. Wait for installation to complete (may take 10-15 minutes)

### Step 3: Install Python Requirements
```bash
pip install -r requirements.txt
```

## Solution 2: Use Pre-compiled Wheels

Try installing pre-compiled wheels instead of building from source:

```bash
pip install --only-binary=all -r requirements.txt
```

## Solution 3: Use Simplified Version (No Ruptures)

If you prefer not to install the build tools, use the simplified version:

### Step 1: Install Simplified Requirements
```bash
pip install -r requirements_simple.txt
```

### Step 2: Run Simple Test
```bash
python test_simple.py
```

### Step 3: Use Simplified Analyzer
The simplified version provides most functionality without the ruptures library:
- Time series analysis
- Event correlation
- Peak detection for change points
- Statistical testing
- Insights generation

## Solution 4: Use Conda (Alternative)

If you have Anaconda/Miniconda installed:

```bash
conda install -c conda-forge ruptures
pip install -r requirements.txt
```

## Verification

After installation, verify everything works:

```bash
# Test basic functionality
python test_simple.py

# If using full version with ruptures
python test_analyzer.py
```

## Troubleshooting

### Common Issues:

1. **"Microsoft Visual C++ 14.0 or greater is required"**
   - Install Microsoft C++ Build Tools (Solution 1)
   - Or use simplified version (Solution 3)

2. **"Permission denied" errors**
   - Run as administrator
   - Or use `--user` flag: `pip install --user -r requirements.txt`

3. **"pip not found"**
   - Install pip: `python -m ensurepip --upgrade`
   - Or use conda: `conda install pip`

4. **"Package not found"**
   - Update pip: `pip install --upgrade pip`
   - Try alternative package sources

### Getting Help:

If you continue to have issues:
1. Check your Python version (3.8+ required)
2. Ensure you're using the correct pip for your Python installation
3. Try creating a fresh virtual environment
4. Check the project's GitHub issues page

## Next Steps

Once installation is complete:

1. **Run the analysis**:
   ```bash
   cd src
   python price_analyzer.py  # Full version
   # OR
   python price_analyzer_simple.py  # Simplified version
   ```

2. **Check results**:
   - Look in `data/processed/` for output files
   - Review the console output for insights

3. **Customize analysis**:
   - Modify event dataset in the code
   - Adjust analysis parameters
   - Add new visualization methods

## System Requirements

- **Python**: 3.8 or higher
- **Memory**: 4GB RAM minimum (8GB recommended)
- **Storage**: 1GB free space
- **OS**: Windows, macOS, or Linux
- **Build Tools**: Microsoft Visual C++ 14.0+ (Windows, for ruptures library) 