Feature: Smoke test
  Basic checks that the app loads and renders correctly.

  Scenario: App loads with triangle visible
    Given I open the app
    Then the page title should be "Triffect"
    And the triangle should be visible

  Scenario: No console errors on load
    Given I open the app
    Then there should be no console errors
