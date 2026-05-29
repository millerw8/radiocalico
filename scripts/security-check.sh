#!/bin/bash

# Radio Calico Security Check Script
# Comprehensive security testing beyond npm audit

set -e

echo "🔒 Radio Calico Security Check"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track issues
ISSUES=0

# 1. Check for hardcoded secrets
echo "1️⃣  Checking for hardcoded secrets..."
if grep -r -i -E '(password|secret|api_key|apikey|token|jwt).*=.*["\047][^"\047]+["\047]' src/ --exclude-dir=node_modules 2>/dev/null | grep -v -E '(PASSWORD|SECRET|TOKEN|API_KEY).*process\.env' | grep -v 'example'; then
    echo -e "${RED}⚠️  Warning: Potential hardcoded secrets found${NC}"
    ISSUES=$((ISSUES+1))
else
    echo -e "${GREEN}✅ No hardcoded secrets found${NC}"
fi
echo ""

# 2. Check for .env file in repository
echo "2️⃣  Checking .env file security..."
if git ls-files | grep -q '^\.env$'; then
    echo -e "${RED}⚠️  Warning: .env file is tracked in git!${NC}"
    ISSUES=$((ISSUES+1))
else
    echo -e "${GREEN}✅ .env file not tracked in git${NC}"
fi
echo ""

# 3. Check for SQL injection patterns
echo "3️⃣  Checking for potential SQL injection..."
if grep -r -E 'query\(.*\+.*\)|query\(.*\$\{.*\}.*\)' src/ --exclude-dir=node_modules 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Warning: Potential SQL injection patterns found${NC}"
    echo "   Review: Use parameterized queries ($1, $2) instead of string concatenation"
    ISSUES=$((ISSUES+1))
else
    echo -e "${GREEN}✅ No obvious SQL injection patterns${NC}"
fi
echo ""

# 4. Check default passwords in docker-compose
echo "4️⃣  Checking for default passwords..."
if grep -E 'PASSWORD.*radiocalico' docker-compose*.yml 2>/dev/null | grep -v 'DB_PASSWORD:-'; then
    echo -e "${YELLOW}⚠️  Warning: Default passwords found in docker-compose files${NC}"
    echo "   Action: Change passwords in production!"
    ISSUES=$((ISSUES+1))
else
    echo -e "${GREEN}✅ No default passwords in docker-compose${NC}"
fi
echo ""

# 5. Check nginx security headers
echo "5️⃣  Checking nginx security headers..."
HEADERS_OK=true
if ! grep -q 'X-Frame-Options' nginx.conf 2>/dev/null; then
    echo -e "${RED}⚠️  Missing: X-Frame-Options${NC}"
    HEADERS_OK=false
    ISSUES=$((ISSUES+1))
fi
if ! grep -q 'X-Content-Type-Options' nginx.conf 2>/dev/null; then
    echo -e "${RED}⚠️  Missing: X-Content-Type-Options${NC}"
    HEADERS_OK=false
    ISSUES=$((ISSUES+1))
fi
if ! grep -q 'X-XSS-Protection' nginx.conf 2>/dev/null; then
    echo -e "${RED}⚠️  Missing: X-XSS-Protection${NC}"
    HEADERS_OK=false
    ISSUES=$((ISSUES+1))
fi
if [ "$HEADERS_OK" = true ]; then
    echo -e "${GREEN}✅ Security headers configured${NC}"
fi
echo ""

# 6. Check for exposed ports
echo "6️⃣  Checking exposed ports..."
if grep -E 'ports:.*5432' docker-compose.yml 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Info: PostgreSQL port exposed on host${NC}"
    echo "   Note: This is OK for development, but restrict in production"
fi
echo -e "${GREEN}✅ Port configuration reviewed${NC}"
echo ""

# 7. Check Docker user
echo "7️⃣  Checking Docker security..."
if grep -q 'USER node' Dockerfile 2>/dev/null; then
    echo -e "${GREEN}✅ Non-root user configured in production${NC}"
else
    echo -e "${YELLOW}⚠️  Warning: No non-root user found in Dockerfile${NC}"
    ISSUES=$((ISSUES+1))
fi
echo ""

# 8. Check for HTTPS configuration
echo "8️⃣  Checking HTTPS/TLS configuration..."
if grep -q 'listen 443 ssl' nginx.conf 2>/dev/null; then
    echo -e "${GREEN}✅ HTTPS configured${NC}"
else
    echo -e "${YELLOW}⚠️  Info: HTTPS not configured in nginx${NC}"
    echo "   Action: Configure SSL/TLS for production"
fi
echo ""

# 9. Run npm audit
echo "9️⃣  Running npm audit..."
if npm audit --audit-level=moderate > /dev/null 2>&1; then
    echo -e "${GREEN}✅ No npm vulnerabilities found${NC}"
else
    echo -e "${RED}⚠️  npm vulnerabilities found${NC}"
    npm audit --audit-level=moderate
    ISSUES=$((ISSUES+1))
fi
echo ""

# 10. Check for rate limiting
echo "🔟 Checking rate limiting..."
if grep -q 'limit_req' nginx.conf 2>/dev/null; then
    echo -e "${GREEN}✅ Rate limiting configured${NC}"
else
    echo -e "${YELLOW}⚠️  Info: No rate limiting found${NC}"
    echo "   Recommendation: Add rate limiting in production"
fi
echo ""

# 11. Run Trivy container scans (if available)
echo "1️⃣1️⃣  Scanning Docker images with Trivy..."
if command -v trivy &> /dev/null; then
    TRIVY_ISSUES=false

    # Check if images exist before scanning
    if docker images | grep -q 'radiocalico-radiocalico-prod'; then
        echo "   Scanning production image..."
        if trivy image --severity HIGH,CRITICAL --exit-code 1 radiocalico-radiocalico-prod:latest 2>&1 | grep -q 'Total: 0'; then
            echo -e "   ${GREEN}✅ Production image: No HIGH/CRITICAL vulnerabilities${NC}"
        else
            echo -e "   ${RED}⚠️  Production image: Vulnerabilities found${NC}"
            trivy image --severity HIGH,CRITICAL radiocalico-radiocalico-prod:latest 2>&1 | tail -20
            TRIVY_ISSUES=true
            ISSUES=$((ISSUES+1))
        fi
    else
        echo -e "   ${YELLOW}ℹ️  Production image not built yet${NC}"
    fi

    # Scan base images
    echo "   Scanning base images..."
    if trivy image --severity HIGH,CRITICAL postgres:16-alpine 2>&1 | grep -q 'Total: 0'; then
        echo -e "   ${GREEN}✅ postgres:16-alpine: No HIGH/CRITICAL vulnerabilities${NC}"
    else
        echo -e "   ${YELLOW}⚠️  postgres:16-alpine: Vulnerabilities found${NC}"
        TRIVY_ISSUES=true
    fi

    if trivy image --severity HIGH,CRITICAL nginx:alpine 2>&1 | grep -q 'Total: 0'; then
        echo -e "   ${GREEN}✅ nginx:alpine: No HIGH/CRITICAL vulnerabilities${NC}"
    else
        echo -e "   ${YELLOW}⚠️  nginx:alpine: Vulnerabilities found${NC}"
        TRIVY_ISSUES=true
    fi

    if [ "$TRIVY_ISSUES" = false ]; then
        echo -e "${GREEN}✅ All container images clean${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Trivy not installed${NC}"
    echo "   Install: brew install aquasecurity/trivy/trivy"
    echo "   Or: curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin"
fi
echo ""

# Summary
echo "================================"
if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✅ Security check passed!${NC}"
    echo "No critical issues found."
    exit 0
else
    echo -e "${YELLOW}⚠️  Security check completed with $ISSUES warning(s)${NC}"
    echo "Review the warnings above and address them before production deployment."
    exit 0  # Don't fail, just warn
fi
