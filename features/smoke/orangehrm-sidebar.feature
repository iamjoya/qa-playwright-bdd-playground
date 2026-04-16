@smoke @ui @orangehrm
@allure.label.owner:qa-team
Feature: OrangeHRM Sidebar Navigation and Search

  As a logged-in admin
  I want to navigate using the sidebar menus
  So that I can access different modules quickly

  Background:
    Given I am logged in to OrangeHRM as admin

  @P1
  @allure.label.severity:critical
  Scenario Outline: Sidebar menu item navigates to the correct page
    When I click the "<menuItem>" sidebar menu
    Then I should be navigated to the OrangeHRM "<expectedUrlFragment>" page

    Examples:
      | menuItem    | expectedUrlFragment         |
      | Admin       | /web/index.php/admin/       |
      | PIM         | /web/index.php/pim/         |
      | Recruitment | /web/index.php/recruitment/ |
      | Dashboard   | /web/index.php/dashboard/   |

  @P1
  @allure.label.severity:critical
  Scenario: Sidebar search filters menu items to matching results
    When I search "Admin" in the sidebar
    Then the sidebar should show the "Admin" menu item
    And non-matching sidebar items should not be visible

  @P1
  @allure.label.severity:critical
  Scenario: Sidebar search with no matching term shows no results
    When I search "ZZZNOTEXIST" in the sidebar
    Then no sidebar menu items should be visible

  @P2
  @allure.label.severity:normal
  Scenario: Clearing sidebar search restores all menu items
    When I search "Leave" in the sidebar
    And I clear the sidebar search
    Then all sidebar menu items should be visible

  @smoke @visual @P2
  @allure.label.severity:normal
  Scenario: OrangeHRM sidebar visual baseline
    Then the OrangeHRM sidebar should match the visual baseline
