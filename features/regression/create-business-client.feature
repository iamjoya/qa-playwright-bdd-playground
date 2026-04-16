@regression @ui
@allure.label.owner:qa-team
Feature: Create Business Client

  As an admin
  I want to create a new business client
  So that the company entity can be managed within the platform

  Background:
    Given I am logged in as admin
    And I navigate to the clients page

  @P2
  @allure.label.severity:normal
  Scenario: Create business client with required fields only
    When I open the Add Client dialog
    And I select client type "Business"
    And I fill in the business client details with "business.valid" data
    And I proceed through the remaining steps
    Then the client "business.valid" should appear in the clients list

  @regression @visual @P2
  @allure.label.severity:normal
  Scenario: Add Client dialog Business type visual baseline
    When I open the Add Client dialog
    And I select client type "Business"
    Then the Add Client dialog should match the visual baseline "add-client-dialog-business.png"
