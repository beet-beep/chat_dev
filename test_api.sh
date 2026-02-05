#!/bin/bash
# Test script
curl -s "http://127.0.0.1:5173/api/faq-categories/" 2>&1 | head -c 500
echo ""
echo "---"
curl -s "http://127.0.0.1:8000/api/faq-categories/" 2>&1 | head -c 500
