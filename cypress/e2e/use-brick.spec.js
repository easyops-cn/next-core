/// <reference types="Cypress" />

for (const port of Cypress.env("ports")) {
  const origin = `http://localhost:${port}`;

  describe(`Testing useBrick on port ${port}`, () => {
    it("should render useBrick", () => {
      cy.visit(`${origin}/e2e/use-brick/1`, {
        onBeforeLoad(win) {
          cy.spy(win.console, "error").as("console.error");
        },
      });

      // `useBrick` will render asynchronously,
      // so wait for specific content rendered.
      cy.contains("X:4:2");
      cy.contains("Modal:4:0");
      cy.contains("Modal:S:8");

      cy.get("@console.error").should("not.be.called");

      cy.expectMainContents([
        "X:Z:1X:Z:2",
        "X:3:1X:3:2X:4:1X:4:2",
        "",
        "Reset",
      ]);
      cy.expectPortalContentsUnordered([
        "Modal:S:7",
        "Modal:S:8",
        "Modal:Z:0",
        "Modal:3:0",
        "Modal:4:0",
      ]);

      cy.contains("Reset").click();

      cy.contains("X:5:2");
      cy.contains("Modal:5:0");
      cy.contains("Modal:S:9");
      cy.expectMainContents([
        "X:Z:1X:Z:2",
        "X:3:1X:3:2X:5:1X:5:2",
        "",
        "Reset",
      ]);
      cy.expectPortalContentsUnordered([
        "Modal:S:7",
        "Modal:Z:0",
        "Modal:3:0",
        "Modal:S:9",
        "Modal:5:0",
      ]);

      cy.contains("Reset").click();

      cy.contains("X:4:2");
      cy.contains("Modal:4:0");
      cy.contains("Modal:S:8");
      cy.expectMainContents(["X:Z:1X:Z:2", "X:4:1X:4:2", "", "Reset"]);
      cy.expectPortalContentsUnordered(["Modal:Z:0", "Modal:S:8", "Modal:4:0"]);
    });

    it("should work for bricks within useBrick accessing the template refs", () => {
      cy.visit(`${origin}/e2e/use-brick/2`, {
        onBeforeLoad(win) {
          cy.spy(win.console, "error").as("console.error");
        },
      });

      cy.contains("Inner Mounted <C>");

      cy.get("@console.error").should("not.be.called");

      cy.contains("Click Me").click();
      cy.contains("Inner Updated");
    });

    it("should work for nested useBrick and tpl accessing the template refs", () => {
      cy.visit(`${origin}/e2e/use-brick/3`, {
        onBeforeLoad(win) {
          cy.spy(win.console, "error").as("console.error");
        },
      });

      cy.contains("Outer Initial");
      cy.contains("Inner Mounted <C>");

      cy.get("@console.error").should("not.be.called");

      cy.contains("Click Me").click();
      cy.contains("Inner Updated");
      cy.contains("Outer Initial");
    });
  });
}
