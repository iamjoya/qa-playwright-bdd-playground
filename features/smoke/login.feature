@smoke @ui
@allure.label.owner:qa-team
Feature: User Login

  As an admin
  I want to log in to the Brook application
  So that I can access the admin dashboard

  @P1
  @allure.label.severity:critical
  Scenario: Successful login with admin credentials
    Given I am on the login page
    When I log in with the "admin" credentials
    Then I should be redirected to the expected landing page for "admin"
    And the clients navigation should be visible

  @P1
  @allure.label.severity:critical
  Scenario: Login fails with wrong credentials
    Given I am on the login page
    When I log in with the "invalid" credentials
    Then I should see the expected error message for "invalid"

  @smoke @visual @P2
  @allure.label.severity:normal
  Scenario: Login page visual baseline
    Given I am on the login page
    Then the login page should match the visual baseline
