@smoke @ui @orangehrm
@allure.label.owner:qa-team
Feature: OrangeHRM Login

  As a user
  I want to log in to OrangeHRM
  So that I can access the HR system

  Background:
    Given I am on the OrangeHRM login page

  @P1
  @allure.label.severity:critical
  Scenario: Successful login with valid admin credentials
    When I log in to OrangeHRM with "admin" credentials
    Then I should be redirected to the OrangeHRM dashboard
    And the sidebar navigation should be visible

  @P1
  @allure.label.severity:critical
  Scenario: Login fails with invalid password
    When I log in to OrangeHRM with "invalidPassword" credentials
    Then I should see the OrangeHRM login error for "invalidPassword"

  @P2
  @allure.label.severity:normal
  Scenario: Login fails with invalid username
    When I log in to OrangeHRM with "invalidUsername" credentials
    Then I should see the OrangeHRM login error for "invalidUsername"

  @P2
  @allure.label.severity:normal
  Scenario: Login fails with empty username
    When I submit the OrangeHRM login form with empty "username"
    Then I should see the OrangeHRM field required error for "username"

  @P2
  @allure.label.severity:normal
  Scenario: Login fails with empty password
    When I submit the OrangeHRM login form with empty "password"
    Then I should see the OrangeHRM field required error for "password"

  @smoke @visual @P2
  @allure.label.severity:normal
  Scenario: OrangeHRM login page visual baseline
    Then the OrangeHRM login page should match the visual baseline
