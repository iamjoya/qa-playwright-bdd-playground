@api
@allure.label.owner:qa-team
Feature: Reqres Products API

  As an API consumer
  I want to manage products via the Reqres Products API
  So that I can create, retrieve, and update product records

  @P1
  @allure.label.severity:critical
  Scenario: Create a product successfully
    When I send a POST request to create a product with "valid" data
    Then the products API response status should match "createProduct.created"
    And the products API response body should contain the expected fields for "createProduct.created"

  @P1
  @allure.label.severity:critical
  Scenario: Retrieve a created product by id
    Given I have created a product with "valid" data
    When I send a GET request to retrieve the created product
    Then the products API response status should match "getProduct.found"
    And the products API response body should contain the expected fields for "getProduct.found"

  @P1
  @allure.label.severity:critical
  Scenario: Update a created product by id
    Given I have created a product with "valid" data
    When I send a PUT request to update the product with "updateProduct" data
    Then the products API response status should match "updateProduct.updated"
    And the products API response body should contain the expected fields for "updateProduct.updated"

  @P2
  @allure.label.severity:normal
  Scenario: Create product without API key returns 401
    When I send an unauthenticated POST request to create a product
    Then the products API response status should match "createProduct.noApiKey"

  @P2
  @allure.label.severity:normal
  Scenario: Create product with invalid API key returns 403
    When I send a POST request with an invalid API key to create a product
    Then the products API response status should match "createProduct.invalidApiKey"

  @P2
  @allure.label.severity:normal
  Scenario: Retrieve a non-existent product returns 404
    When I send a GET request for product id "nonExistentId"
    Then the products API response status should match "getProduct.notFound"

  @P2
  @allure.label.severity:normal
  Scenario: Update a non-existent product returns 404
    When I send a PUT request to update product id "nonExistentId" with "updateProduct" data
    Then the products API response status should match "updateProduct.notFound"
