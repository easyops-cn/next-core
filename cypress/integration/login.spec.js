/// <reference types="Cypress" />

describe("Login page", () => {
  it("show error message if username or password is not matched", () => {
    // We test as the real world with `--subdir`.
    cy.visit("/next/?lng=zh");
    cy.location("pathname").should("eq", "/next/auth/login");
    cy.get('input[placeholder="用户名"]').type("easyops");
    cy.get('input[placeholder="密码"]').type("oops");
    cy.get('button[type="submit"]').click();
    cy.contains("用户名或密码错误");
  });

  it("redirect to login page and redirect back to previous page in zh", () => {
    // We test as the real world with `--subdir`.
    cy.visit("/next/?lng=zh");
    cy.location("pathname").should("eq", "/next/auth/login");
    cy.get('input[placeholder="用户名"]').type("easyops");
    cy.get('input[placeholder="密码"]').type("easyops");
    cy.get('button[type="submit"]').click();
    cy.url().should("eq", `${Cypress.config("baseUrl")}/next/?lng=zh`);
    cy.contains("basic-bricks\\.app-bar", "easyops");
  });

  it(
    "redirect to login page and redirect back to previous page in en",
    {
      // Cookies may be not always cleared between tests.
      // Ref https://github.com/cypress-io/cypress/issues/781
      retries: {
        runMode: 1,
      },
    },
    () => {
      // We test as the real world with `--subdir`.
      cy.visit("/next/?lng=en");
      cy.location("pathname").should("eq", "/next/auth/login");
      cy.get('input[placeholder="Username"]').type("easyops");
      cy.get('input[placeholder="Password"]').type("easyops");
      cy.get('button[type="submit"]').click();
      cy.url().should("eq", `${Cypress.config("baseUrl")}/next/?lng=en`);
      cy.contains("basic-bricks\\.app-bar", "easyops");
    }
  );
});
