Feature: Affect entry logging
  Users tap the triangle to log their emotional state.

  Scenario: Tap triangle to select a point
    Given I open the app
    When I tap the center of the triangle
    Then a selection marker should appear
    And the entry form should be visible

  Scenario: Log an entry without a note
    Given I open the app
    When I tap the center of the triangle
    And I submit the entry
    Then the entry should appear in the list

  Scenario: Log an entry with a note
    Given I open the app
    When I tap the center of the triangle
    And I type "Feeling calm after meditation" in the note field
    And I submit the entry
    Then the entry should appear in the list
    And the entry should show "Feeling calm after meditation"

  Scenario: Form disappears after submission
    Given I open the app
    When I tap the center of the triangle
    And I submit the entry
    Then the entry form should not be visible
