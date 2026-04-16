@regression @ui @orangehrm
@allure.label.owner:qa-team
Feature: OrangeHRM Admin User Management

  As an admin
  I want to add and delete system users
  So that I can manage access to the HR system

  Background:
    Given I am logged in to OrangeHRM as admin
    And I navigate to the Admin User Management page

  @P1
  @allure.label.severity:critical
  Scenario: Add a new system user and then delete them
    When I add a new system user with "valid" data
    Then the user "valid" should appear in the users list
    When I delete the user "valid" from the list
    Then the user "valid" should no longer appear in the users list

  @P2
  @allure.label.severity:normal
  Scenario: Add user form shows validation errors when required fields are empty
    When I open the Add User form
    And I submit the Add User form without filling required fields
    Then required field errors should be displayed on the Add User form

  @P2
  @allure.label.severity:normal
  Scenario: Add user fails when username already exists
    When I add a new system user with "duplicate" data
    Then I should see a duplicate username error

  @regression @visual @P2
  @allure.label.severity:normal
  Scenario: OrangeHRM Admin User Management page visual baseline
    Then the OrangeHRM Admin User Management page should match the visual baseline
