@smoke @ui
@allure.label.owner:qa-team
Feature: Create Individual Client

  As an admin
  I want to create a new individual client
  So that they can be managed within the platform

  Background:
    Given I am logged in as admin
    And I navigate to the clients page

  @P1
  @allure.label.severity:critical
  Scenario: Create individual client with required fields only
    When I open the Add Client dialog
    And I fill in the individual client details with "individual.valid" data
    And I proceed through the remaining steps
    Then the client "individual.valid" should appear in the clients list

  @smoke @visual @P2
  @allure.label.severity:normal
  Scenario: Add Client dialog Step 1 visual baseline
    When I open the Add Client dialog
    Then the Add Client dialog should match the visual baseline "add-client-dialog-individual.png"
