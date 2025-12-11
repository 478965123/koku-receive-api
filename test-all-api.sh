#!/bin/bash

# Ensure PORT is set
PORT=${PORT:-4000}
BASE_URL="http://localhost:$PORT"
API_KEY="$SUPABASE_ANON_KEY"
JWT_TOKEN=""

# Counter for tests
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test Data
TEST_ITEM_ID=""
TEST_ITEM_NO="TEST-ALL-$(date +%s)"
TEST_USER_ID=""
TEST_USER_CODE="EMP-TEST-$(date +%s)"
TEST_USERNAME="testuser$(date +%s)"
TEST_PASSWORD="password123"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Comprehensive API Testing Script    ${NC}"
echo -e "${BLUE}   Target: $BASE_URL                   ${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Function to print test header
test_header() {
  echo -e "\n${YELLOW}▶ Test: $1${NC}"
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

# Function to print success
test_pass() {
  echo -e "${GREEN}✓ PASS: $1${NC}"
  PASSED_TESTS=$((PASSED_TESTS + 1))
}

# Function to print failure
test_fail() {
  echo -e "${RED}✗ FAIL: $1${NC}"
  FAILED_TESTS=$((FAILED_TESTS + 1))
}

# Function to check JSON response
check_success() {
  if echo "$1" | grep -q '"success":true'; then
    return 0
  else
    return 1
  fi
}

# =============================================
# 1. Health Check
# =============================================
test_header "Health Check (GET /health)"
RESPONSE=$(curl -s -X GET "$BASE_URL/health")
if check_success "$RESPONSE"; then
  test_pass "Health check endpoint is working"
else
  test_fail "Health check failed"
  echo "Response: $RESPONSE"
fi

# =============================================
# 2. User Management (Public)
# =============================================
test_header "Create User (POST /users)"
RESPONSE=$(curl -s -X POST "$BASE_URL/users" \
  -H "Content-Type: application/json" \
  -d "{
    \"employee_code\": \"$TEST_USER_CODE\",
    \"name\": \"Test User\",
    \"role\": \"staff\",
    \"username\": \"$TEST_USERNAME\",
    \"password\": \"$TEST_PASSWORD\"
  }")

if check_success "$RESPONSE"; then
  TEST_USER_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  test_pass "User created successfully (ID: $TEST_USER_ID)"
else
  test_fail "Failed to create user"
  echo "Response: $RESPONSE"
fi

test_header "Get All Users (GET /users)"
RESPONSE=$(curl -s -X GET "$BASE_URL/users")
if check_success "$RESPONSE"; then
  test_pass "Retrieved users list successfully"
else
  test_fail "Failed to get users"
  echo "Response: $RESPONSE"
fi

# =============================================
# 3. Authentication
# =============================================
test_header "Login (POST /auth/login)"
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$TEST_USERNAME\",
    \"password\": \"$TEST_PASSWORD\"
  }")

if check_success "$RESPONSE"; then
  # Extract JWT Token
  JWT_TOKEN=$(echo "$RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  
  if [ -n "$JWT_TOKEN" ]; then
    test_pass "Login successful & JWT received"
    echo -e "${YELLOW}Token: ${JWT_TOKEN:0:20}...${NC}"
  else
    test_fail "Login successful but NO JWT Token found"
  fi
else
  test_fail "Login failed"
  echo "Response: $RESPONSE"
fi

# =============================================
# 4. Items (Public)
# =============================================
test_header "Create Item (POST /item)"
RESPONSE=$(curl -s -X POST "$BASE_URL/item" \
  -H "Content-Type: application/json" \
  -d "{
    \"item_no\": \"$TEST_ITEM_NO\",
    \"product_name\": \"Test Item All API\",
    \"category\": \"Testing\"
  }")

if check_success "$RESPONSE"; then
  TEST_ITEM_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  test_pass "Item created successfully (ID: $TEST_ITEM_ID)"
else
  test_fail "Failed to create item"
  echo "Response: $RESPONSE"
fi

test_header "Get All Items (GET /item)"
RESPONSE=$(curl -s -X GET "$BASE_URL/item")
if check_success "$RESPONSE"; then
  test_pass "Retrieved items successfully"
else
  test_fail "Failed to get items"
  echo "Response: $RESPONSE"
fi

test_header "Verify QR Code (POST /item/verify-qr)"
RESPONSE=$(curl -s -X POST "$BASE_URL/item/verify-qr" \
  -H "Content-Type: application/json" \
  -d "{\"qr_code\": \"$TEST_ITEM_NO\"}")

if echo "$RESPONSE" | grep -q '"valid":true'; then
  test_pass "QR Code valid"
else
  test_fail "QR Code validation failed"
  echo "Response: $RESPONSE"
fi

# =============================================
# 5. Product Submissions (Public)
# =============================================
test_header "Get Product Submissions (GET /product-submission)"
RESPONSE=$(curl -s -X GET "$BASE_URL/product-submission")
if check_success "$RESPONSE"; then
  test_pass "Retrieved submissions successfully"
else
  test_fail "Failed to get submissions"
  echo "Response: $RESPONSE"
fi

# =============================================
# 6. Receipts (Protected - Needs JWT)
# =============================================
test_header "Get Receipts (GET /receipt/list) [Protected]"

if [ -z "$JWT_TOKEN" ]; then
    test_fail "Skipping Receipt Test (No JWT Token)"
else
    RESPONSE=$(curl -s -X GET "$BASE_URL/receipt/list" \
      -H "Authorization: Bearer $JWT_TOKEN")

    if check_success "$RESPONSE"; then
      test_pass "Retrieved receipts with JWT"
    else
      # Check if it failed due to missing/invalid key or something else
      if echo "$RESPONSE" | grep -q "Unauthorized"; then
         test_fail "GET /receipt/list failed: Unauthorized (Token likely invalid)"
      else
         # It might fail if database still has issues, but auth passed
         echo "Response: $RESPONSE"
         test_fail "Failed to get receipts (Auth likely OK, but other error)"
      fi
    fi
fi

# =============================================
# 7. Cleanup
# =============================================
test_header "Cleanup User (DELETE /users/:id)"
if [ -n "$TEST_USER_ID" ]; then
  RESPONSE=$(curl -s -X DELETE "$BASE_URL/users/$TEST_USER_ID")
  if check_success "$RESPONSE"; then
    test_pass "User deleted"
  else
    test_fail "Failed to delete user"
  fi
else
    echo "Skipping (No User ID)"
fi

test_header "Cleanup Item (DELETE /item/:id)"
if [ -n "$TEST_ITEM_ID" ]; then
  RESPONSE=$(curl -s -X DELETE "$BASE_URL/item/$TEST_ITEM_ID")
  if check_success "$RESPONSE"; then
    test_pass "Item deleted"
  else
    test_fail "Failed to delete item"
  fi
else
    echo "Skipping (No Item ID)"
fi

echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}          Test Summary                  ${NC}"
echo -e "${BLUE}========================================${NC}"
echo "Total:  $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $FAILED_TESTS"

if [ $FAILED_TESTS -eq 0 ]; then
  exit 0
else
  exit 1
fi
