/// <reference types="Cypress" />

for (const port of Cypress.env("ports")) {
  const origin = `http://localhost:${port}`;

  describe(`Testing control nodes on port ${port}`, () => {
    it("should render general control nodes", () => {
      cy.visit(`${origin}/e2e/control-nodes/1`, {
        onBeforeLoad(win) {
          cy.spy(win.console, "error").as("console.error");
        },
      });

      cy.expectMainContents([
        "Hello World",
        "1",
        ",",
        "2",
        ",",
        "Goodbye World",
      ]);

      cy.get("@console.error").should("not.be.called");
    });

    it("should render nested control nodes", () => {
      cy.visit(`${origin}/e2e/control-nodes/2`, {
        onBeforeLoad(win) {
          cy.spy(win.console, "error").as("console.error");
        },
      });

      cy.expectMainContents([
        "Hello",
        "start:1",
        "a",
        "end:1",
        "start:2",
        "b",
        "c",
        "end:2",
        "Goodbye",
      ]);

      cy.get("@console.error").should("not.be.called");
    });

    it("should render control nodes with tpl with useBrick", () => {
      cy.visit(`${origin}/e2e/control-nodes/3`, {
        onBeforeLoad(win) {
          cy.spy(win.console, "error").as("console.error");
        },
      });

      // `useBrick` will render asynchronously,
      // so wait for specific content rendered.
      cy.contains("X:2:2");
      cy.contains("Modal:2:0");

      cy.get("@console.error").should("not.be.called");

      cy.expectMainContents(["X:1:1X:1:2", "X:2:1X:2:2", "Refresh"]);

      cy.expectPortalContents([
        "Modal:Hello",
        "Modal:Goodbye",
        // These modals are rendered in useBrick, so they are placed at last
        "Modal:1:0",
        "Modal:2:0",
      ]);

      cy.contains("Refresh").click();
      cy.contains("X:4:2");
      cy.contains("Modal:4:0");
      cy.expectMainContents(["X:3:1X:3:2", "X:4:1X:4:2", "Refresh"]);
      cy.expectPortalContents([
        "Modal:Hello",
        "Modal:Goodbye",
        // These modals are rendered in useBrick, so they are placed at last
        "Modal:3:0",
        "Modal:4:0",
      ]);

      cy.contains("Refresh").click();
      cy.contains("X:6:2");
      cy.contains("Modal:6:0");
      cy.expectMainContents(["X:5:1X:5:2", "X:6:1X:6:2", "Refresh"]);
      cy.expectPortalContents([
        "Modal:Hello",
        "Modal:Goodbye",
        // These modals are rendered in useBrick, so they are placed at last
        "Modal:5:0",
        "Modal:6:0",
      ]);
    });

    it("should render control nodes with tpl", () => {
      cy.visit(`${origin}/e2e/control-nodes/4`, {
        onBeforeLoad(win) {
          cy.spy(win.console, "error").as("console.error");
        },
      });

      cy.expectMainContents(["X:1", "X:2", "Refresh"]);
      cy.expectPortalContents([
        "Modal:Hello",
        "Modal:1",
        "Modal:2",
        "Modal:Goodbye",
      ]);

      cy.get("@console.error").should("not.be.called");

      cy.contains("Refresh").click();
      cy.expectMainContents(["X:3", "X:4", "Refresh"]);
      cy.expectPortalContents([
        "Modal:Hello",
        "Modal:3",
        "Modal:4",
        "Modal:Goodbye",
      ]);

      cy.contains("Refresh").click();
      cy.expectMainContents(["X:5", "X:6", "Refresh"]);
      cy.expectPortalContents([
        "Modal:Hello",
        "Modal:5",
        "Modal:6",
        "Modal:Goodbye",
      ]);
    });

    it("should render tracking if expressions as control nodes", () => {
      cy.visit(`${origin}/e2e/control-nodes/5`, {
        onBeforeLoad(win) {
          cy.spy(win.console, "error").as("console.error");
        },
      });

      cy.contains("Data:8");
      cy.expectMainContents(["Toggle", "Data:8"]);

      cy.get("@console.error").should("not.be.called");

      cy.contains("Toggle").click();
      cy.contains("Data:7");
      cy.expectMainContents(["Toggle", "Data:7"]);
    });

    it("should render :if with direct child of :if", () => {
      cy.visit(`${origin}/e2e/control-nodes/6`, {
        onBeforeLoad(win) {
          cy.spy(win.console, "error").as("console.error");
        },
      });

      cy.contains("If in If <false>");
      cy.expectMainContents([
        ["Hello", "prefix", "If in If <false>", "suffix", "Toggle"].join(""),
      ]);

      cy.get("@console.error").should("not.be.called");

      cy.contains("Toggle").click();
      cy.contains("If in If <true>");
      cy.expectMainContents([
        ["Hello", "prefix", "If in If <true>", "suffix", "Toggle"].join(""),
      ]);
    });

    it("should render :forEach with direct child of :forEach", () => {
      cy.visit(`${origin}/e2e/control-nodes/7`, {
        onBeforeLoad(win) {
          cy.spy(win.console, "error").as("console.error");
        },
      });

      cy.contains("ForEach in ForEach <1>");
      cy.expectMainContents([
        ["Hello", "prefix", "ForEach in ForEach <1>", "suffix", "Toggle"].join(
          ""
        ),
        "[forEach mount] false 1",
      ]);

      cy.get("@console.error").should("not.be.called");

      cy.contains("Toggle").click();
      cy.contains("ForEach in ForEach <2>");
      cy.expectMainContents([
        ["Hello", "prefix", "ForEach in ForEach <2>", "suffix", "Toggle"].join(
          ""
        ),
        "[forEach mount] false 1, [forEach unmount] 2, [forEach mount] true 2",
      ]);
    });

    it("should render :forEach with empty initial", () => {
      cy.visit(`${origin}/e2e/control-nodes/8`, {
        onBeforeLoad(win) {
          cy.spy(win.console, "error").as("console.error");
        },
      });

      cy.contains("[a]");
      cy.contains("[b]");
      cy.expectMainContents([
        ["Hello", "[a] 0: 1", "[b] 0: 2", "World"].join(""),
        "Add",
      ]);

      cy.get("@console.error").should("not.be.called");

      cy.contains("Add").click();
      cy.contains("3");
      cy.contains("4");
      cy.expectMainContents([
        ["Hello", "[a] 0: 1", "[a] 1: 3", "[b] 0: 2", "[b] 1: 4", "World"].join(
          ""
        ),
        "Add",
      ]);

      cy.contains("Add").click();
      cy.contains("[a]").should("not.exist");
      cy.contains("[b]").should("not.exist");
      cy.expectMainContents([["Hello", "World"].join(""), "Add"]);

      cy.contains("Add").click();
      cy.contains("[a]");
      cy.contains("[b]");
      cy.expectMainContents([
        ["Hello", "[a] 0: 5", "[b] 0: 6", "World"].join(""),
        "Add",
      ]);
    });
  });
}
