#!/bin/bash

# API Testing Script for Receiving System
# Usage: ./test-api.sh or npm run test:api

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# API Base URL
BASE_URL="http://localhost:3000"

# Counter for tests
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test item ID (will be populated after creation)
TEST_ITEM_ID=""
TEST_ITEM_NO="TEST-AUTO-$(date +%s)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   API Testing Script - Receiving API  ${NC}"
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

# Function to extract value from JSON
extract_json_value() {
  echo "$1" | grep -o "\"$2\":\"[^\"]*\"" | cut -d'"' -f4
}

echo -e "${BLUE}Starting API tests...${NC}\n"

# =============================================
# Test 1: Health Check
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
# Test 2: Create New Item
# =============================================
test_header "Create New Item (POST /item)"
RESPONSE=$(curl -s -X POST "$BASE_URL/item" \
  -H "Content-Type: application/json" \
  -d "{
    \"item_no\": \"$TEST_ITEM_NO\",
    \"product_name\": \"สินค้าทดสอบอัตโนมัติ\",
    \"description\": \"สร้างโดย test script\",
    \"category\": \"ทดสอบ\"
  }")

if check_success "$RESPONSE"; then
  TEST_ITEM_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
  test_pass "Item created successfully (ID: $TEST_ITEM_ID)"
else
  test_fail "Failed to create item"
  echo "Response: $RESPONSE"
fi

# =============================================
# Test 3: Get All Items
# =============================================
test_header "Get All Items (GET /item)"
RESPONSE=$(curl -s -X GET "$BASE_URL/item")
if check_success "$RESPONSE"; then
  test_pass "Retrieved items list successfully"
else
  test_fail "Failed to get items"
  echo "Response: $RESPONSE"
fi

# =============================================
# Test 4: Verify QR Code (Valid)
# =============================================
test_header "Verify Valid QR Code (POST /item/verify-qr)"
RESPONSE=$(curl -s -X POST "$BASE_URL/item/verify-qr" \
  -H "Content-Type: application/json" \
  -d "{\"qr_code\": \"$TEST_ITEM_NO\"}")

if echo "$RESPONSE" | grep -q '"valid":true'; then
  test_pass "QR Code validation successful (valid = true)"
else
  test_fail "QR Code should be valid"
  echo "Response: $RESPONSE"
fi

# =============================================
# Test 5: Verify QR Code (Invalid)
# =============================================
test_header "Verify Invalid QR Code (POST /item/verify-qr)"
RESPONSE=$(curl -s -X POST "$BASE_URL/item/verify-qr" \
  -H "Content-Type: application/json" \
  -d '{"qr_code": "INVALID-QR-999999"}')

if echo "$RESPONSE" | grep -q '"valid":false'; then
  test_pass "Invalid QR Code detected correctly (valid = false)"
else
  test_fail "Invalid QR Code should return valid = false"
  echo "Response: $RESPONSE"
fi

# =============================================
# Test 6: Update Item
# =============================================
if [ -n "$TEST_ITEM_ID" ]; then
  test_header "Update Item (PUT /item/:id)"
  RESPONSE=$(curl -s -X PUT "$BASE_URL/item/$TEST_ITEM_ID" \
    -H "Content-Type: application/json" \
    -d '{
      "product_name": "สินค้าทดสอบอัตโนมัติ (แก้ไขแล้ว)",
      "description": "อัพเดทโดย test script"
    }')

  if check_success "$RESPONSE"; then
    test_pass "Item updated successfully"
  else
    test_fail "Failed to update item"
    echo "Response: $RESPONSE"
  fi
else
  test_fail "Cannot update item - no TEST_ITEM_ID"
fi

# =============================================
# Test 7: Validation - Missing Required Field
# =============================================
test_header "Validation Test - Missing item_no (POST /item)"
RESPONSE=$(curl -s -X POST "$BASE_URL/item" \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "สินค้าไม่มี item_no"
  }')

if echo "$RESPONSE" | grep -q '"success":false'; then
  test_pass "Validation error caught (missing item_no)"
else
  test_fail "Should return validation error"
  echo "Response: $RESPONSE"
fi

# =============================================
# Test 8: Duplicate item_no Test
# =============================================
test_header "Duplicate Test - Same item_no (POST /item)"
RESPONSE=$(curl -s -X POST "$BASE_URL/item" \
  -H "Content-Type: application/json" \
  -d "{
    \"item_no\": \"$TEST_ITEM_NO\",
    \"product_name\": \"สินค้าซ้ำ\"
  }")

if echo "$RESPONSE" | grep -q "already exists"; then
  test_pass "Duplicate item_no detected correctly"
else
  test_fail "Should return duplicate error"
  echo "Response: $RESPONSE"
fi

# =============================================
# Test 9: Update Non-Existent Item
# =============================================
test_header "Update Non-Existent Item (PUT /item/:id)"
FAKE_ID="00000000-0000-0000-0000-000000000000"
RESPONSE=$(curl -s -X PUT "$BASE_URL/item/$FAKE_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "ไม่ควรอัพเดท"
  }')

if echo "$RESPONSE" | grep -q "not found"; then
  test_pass "Non-existent item error handled correctly"
else
  test_fail "Should return 'not found' error"
  echo "Response: $RESPONSE"
fi

# =============================================
# Test 10: Delete Item (Cleanup)
# =============================================
if [ -n "$TEST_ITEM_ID" ]; then
  test_header "Delete Item (DELETE /item/:id)"
  RESPONSE=$(curl -s -X DELETE "$BASE_URL/item/$TEST_ITEM_ID")

  if check_success "$RESPONSE"; then
    test_pass "Item deleted successfully"
  else
    test_fail "Failed to delete item"
    echo "Response: $RESPONSE"
  fi
else
  test_fail "Cannot delete item - no TEST_ITEM_ID"
fi

# =============================================
# Test 11: Verify Deleted Item QR
# =============================================
test_header "Verify Deleted Item QR Code (POST /item/verify-qr)"
RESPONSE=$(curl -s -X POST "$BASE_URL/item/verify-qr" \
  -H "Content-Type: application/json" \
  -d "{\"qr_code\": \"$TEST_ITEM_NO\"}")

if echo "$RESPONSE" | grep -q '"valid":false'; then
  test_pass "Deleted item QR Code is invalid (as expected)"
else
  test_fail "Deleted item should return valid = false"
  echo "Response: $RESPONSE"
fi

# =============================================
# Summary
# =============================================
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}            Test Summary                ${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Total Tests:  ${TOTAL_TESTS}"
echo -e "${GREEN}Passed:       ${PASSED_TESTS}${NC}"
echo -e "${RED}Failed:       ${FAILED_TESTS}${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "\n${GREEN}🎉 All tests passed! API is working correctly.${NC}\n"
  exit 0
else
  echo -e "\n${RED}❌ Some tests failed. Please check the output above.${NC}\n"
  exit 1
fi
