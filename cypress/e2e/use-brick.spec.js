/// <reference types="Cypress" />

for (const port of Cypress.env("ports")) {
  const origin = `http://localhost:${port}`;

  describe(`Testing useBrick on port ${port}`, () => {
    it("should render useBrick", () => {
      cy.visit(`${origin}/e2e/use-brick`, {
        onBeforeLoad(win) {
          cy.spy(win.console, "error").as("console.error");
        },
      });
      cy.get("@console.error").should("not.be.called");

      cy.contains("X:Z:1");
      cy.contains("X:Z:2");
      cy.contains("X:3:1");
      cy.contains("X:3:2");
      cy.contains("X:4:1");
      cy.contains("X:4:2");
      cy.contains("Modal:Z:0");
      cy.contains("Modal:3:0");
      cy.contains("Modal:4:0");

      cy.contains("Reset").click();

      cy.contains("X:Z:1");
      cy.contains("X:Z:2");
      cy.contains("X:5:1");
      cy.contains("X:5:2");
      cy.contains("X:6:1");
      cy.contains("X:6:2");
      cy.contains("Modal:Z:0");
      cy.contains("Modal:5:0");
      cy.contains("Modal:6:0");
    });
  });
}
