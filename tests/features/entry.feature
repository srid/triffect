Feature: Affect entry logging
  Users tap the triangle to log their emotional state.

  Scenario: Tap triangle to log an entry
    Given I open the app
    When I tap the center of the triangle
    Then a trail dot should appear on the triangle

  Scenario: Mobile touch creates exactly one entry
    Given I open the app on mobile
    When I touch the center of the triangle
    Then exactly 1 new trail dot should appear
