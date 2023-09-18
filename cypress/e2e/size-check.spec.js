/// <reference types="Cypress" />
/* global expect */

const jsRegExp = /\.js(?:$|\?|#)/;
const cssRegExp = /\.css(?:$|\?|#)/;

for (const port of Cypress.env("ports")) {
  const origin = `http://localhost:${port}`;

  describe(`Size checking on port ${port}`, () => {
    it("should check resource size", () => {
      cy.visit(`${origin}/e2e/size-check`, {
        onBeforeLoad(win) {
          cy.spy(win.console, "error").as("console.error");
        },
      });

      cy.contains("This is size check!");
      cy.get("@console.error").should("not.be.called");

      cy.window().then((win) => {
        const { performance } = win;
        const resources = performance.getEntriesByType("resource");
        let js = 0;
        let css = 0;
        let others = 0;
        resources.map((resource) => {
          if (jsRegExp.test(resource.name)) {
            js += resource.transferSize;
          } else if (cssRegExp.test(resource.name)) {
            css += resource.transferSize;
          } else {
            others += resource.transferSize;
          }
        });
        const total = js + css + others;

        expect(total, "total resource").to.be.lessThan(3e5);
        expect(js, "js resource").to.be.lessThan(2.8e5);
        expect(css, "css resource").to.be.lessThan(2e4);
        expect(others, "other resource").to.be.lessThan(1e4);
      });
    });
  });
}
