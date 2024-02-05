/// <reference types="Cypress" />

for (const port of Cypress.env("ports")) {
  const origin = `http://localhost:${port}`;

  describe(`Testing sub-routes incremental rendering on port ${port}`, () => {
    it("should render sub-routes", () => {
      cy.visit(`${origin}/e2e/sub-routes/1`, {
        onBeforeLoad(win) {
          cy.spy(win.console, "error").as("console.error");
          cy.spy(win.console, "info").as("console.info");
        },
      });

      cy.contains("Sub Route 1 [1]");

      cy.expectMainContents([
        "Hello",
        "[i: 0] x: 0",
        "Go 1",
        "Go 2",
        "Go 2/x",
        "Go 2/y",
        "Go 3",
        "Go 4",
        "Go 5",
        "Go other",
        "Sub Route 1 [1][i: 1] x: 1",
      ]);

      cy.get("@console.info").should("be.calledWith", "Mounted Root");
      cy.get("@console.info").should("have.callCount", 1);

      // Incremental rendering
      cy.contains("Go 2").click();
      cy.contains("Sub Route 2 [2][i: 2] x: 2");
      cy.expectMainContents([
        "Hello",
        "[i: 0] x: 0",
        "Go 1",
        "Go 2",
        "Go 2/x",
        "Go 2/y",
        "Go 3",
        "Go 4",
        "Go 5",
        "Go other",
        "Sub Route 2 [2][i: 2] x: 2",
      ]);

      cy.get("@console.info").should("be.calledWith", "Mounted 2");
      cy.get("@console.info").should("have.callCount", 2);

      // Empty sub-route
      cy.contains("Go 3").click();
      cy.contains("Sub Route 2 [2][i: 2] x: 2").should("not.exist");
      cy.expectMainContents([
        "Hello",
        "[i: 0] x: 0",
        "Go 1",
        "Go 2",
        "Go 2/x",
        "Go 2/y",
        "Go 3",
        "Go 4",
        "Go 5",
        "Go other",
        "",
      ]);

      cy.get("@console.info").should("be.calledWith", "Unmounted 2");
      cy.get("@console.info").should("have.callCount", 3);

      cy.get("@console.error").should("not.be.called");

      // Sub-route fails
      cy.contains("Go 4").click();
      cy.contains("SyntaxError");
      cy.expectMainContents([
        "Hello",
        "[i: 0] x: 0",
        "Go 1",
        "Go 2",
        "Go 2/x",
        "Go 2/y",
        "Go 3",
        "Go 4",
        "Go 5",
        "Go other",
        'SyntaxError: Unexpected token (1:4), in "<% CTX. %>"',
      ]);

      cy.get("@console.error").should("be.called");

      // Sub-route redirects
      cy.contains("Go 5").click();
      cy.contains("Sub Route 2 [2][i: 2] x: 2");
      cy.expectMainContents([
        "Hello",
        "[i: 0] x: 0",
        "Go 1",
        "Go 2",
        "Go 2/x",
        "Go 2/y",
        "Go 3",
        "Go 4",
        "Go 5",
        "Go other",
        "Sub Route 2 [2][i: 2] x: 2",
      ]);

      // cy.get("@console.info").should("be.calledWith", "Mounted 2");
      cy.get("@console.info").should("have.callCount", 4);

      // Inner nested sub-route
      cy.contains("Go 2/x").click();
      cy.contains("Sub Route 2 [2][i: 2] x: 2");
      cy.expectMainContents([
        "Hello",
        "[i: 0] x: 0",
        "Go 1",
        "Go 2",
        "Go 2/x",
        "Go 2/y",
        "Go 3",
        "Go 4",
        "Go 5",
        "Go other",
        "Sub Route 2 [2][i: 2] x: 2X",
      ]);

      cy.get("@console.info").should("be.calledWith", "Mounted X");
      cy.get("@console.info").should("have.callCount", 5);

      // Inner nested sub-route
      cy.contains("Go 2/y").click();
      cy.contains("Sub Route 2 [2][i: 2] x: 2");
      cy.expectMainContents([
        "Hello",
        "[i: 0] x: 0",
        "Go 1",
        "Go 2",
        "Go 2/x",
        "Go 2/y",
        "Go 3",
        "Go 4",
        "Go 5",
        "Go other",
        "Sub Route 2 [2][i: 2] x: 2Y",
      ]);

      cy.get("@console.info").should("be.calledWith", "Unmounted X");
      cy.get("@console.info").should("be.calledWith", "Mounted Y");
      cy.get("@console.info").should("have.callCount", 7);

      // Outside route
      cy.contains("Go other").click();
      cy.contains("Real Other Route");
      cy.contains("Hello").should("not.exist");

      cy.get("@console.info").should("be.calledWith", "Unmounted Y");
      cy.get("@console.info").should("be.calledWith", "Unmounted 2");
      cy.get("@console.info").should("be.calledWith", "Unmounted Root");
      cy.get("@console.info").should("have.callCount", 10);
    });
  });
}
