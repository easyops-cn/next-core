/// <reference types="Cypress" />

const port = Cypress.env("mainPort");
const origin = `http://localhost:${port}`;

describe(`Login page on port ${port}`, () => {
  beforeEach(() => {
    cy.logout(origin);
  });

  it("redirect to login page", () => {
    // We test as the real world with `--subdir`.
    cy.visit(`${origin}/next/home/?lng=zh`);
    cy.location("pathname").should("eq", "/next/auth/login");
    cy.contains("Developing Login");
  });
});
