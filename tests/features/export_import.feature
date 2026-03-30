Feature: Export and import entries
  Users can back up their data to JSON and restore it elsewhere.

  Scenario: Export produces a valid JSON file
    Given I open the app
    When I tap the center of the triangle
    And I click "Export data"
    Then the downloaded JSON should have version 1 and at least 1 entry

  Scenario: Import restores entries from a file
    Given I open the app
    When I import a JSON file with 3 entries
    Then the import should add 3 new trail dots

  Scenario: Import skips duplicate entries
    Given I open the app
    When I import a JSON file with 3 entries
    And I import the same JSON file again
    Then the import should add 0 new trail dots
