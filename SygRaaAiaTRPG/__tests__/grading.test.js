/**
 * @jest-environment node
 */

const fs = require('fs');
const path = require("path");
const { JSDOM } = require("jsdom");
const { window } = new JSDOM(fs.readFileSync(path.resolve(__dirname, "../index.html"), 'utf8'));
const { document } = window;
const { screen } = require('@testing-library/jest-dom');

let html = fs.readFileSync(path.resolve(__dirname, "../index.html"), 'utf8');
let css = fs.readFileSync(path.resolve(__dirname, "../styles.css"), 'utf8')

describe ("Grading Tests: ", function () {

   it("HTML includes the correct number of certain elements", function() {
         let pElements = document.getElementsByTagName("P").length;
         let headerElements = document.getElementsByTagName("Header").length;
         let footerElements = document.getElementsByTagName("Footer").length;
         let mainElements = document.getElementsByTagName("Main").length;
         let articleElements = document.getElementsByTagName("Article").length;
         let imageElements = document.getElementsByTagName("img").length;

         expect(pElements).toBeGreaterThanOrEqual(1);
         expect(headerElements).toBeGreaterThanOrEqual(1);
         expect(footerElements).toBeGreaterThanOrEqual(1);
         expect(mainElements).toBeGreaterThanOrEqual(1);
         expect(articleElements).toBeGreaterThanOrEqual(1);
         expect(imageElements).toBeGreaterThanOrEqual(1);
   })

   it("HTML contains correct number of sections", function() {
      let childrenElements = document.body.children;

      expect(childrenElements.length).toBeGreaterThanOrEqual(3);
      expect(childrenElements.length).toBeLessThanOrEqual(10);
   })

   it("HTML includes external CSS script", function() {
      let linkElement = document.getElementsByTagName("Link");
      expect(linkElement.item(0).href.includes('styles.css')).toBe(true);
   })

   it("CSS body sets margin and display", function() {
      expect(window.getComputedStyle(document.body).display).toBe("block");
      expect(window.getComputedStyle(document.body).margin).toBe("8px");
   })

   it("CSS funParagraph class is green", function() {
      expect(css.includes(".funParagraph")).toBe(true);
      expect(css.includes("color: green;")).toBe(true);
   })

   it("CSS mainHeading id is red", function() {
      expect(css.includes("#mainHeading")).toBe(true);
      expect(css.includes("color: red;")).toBe(true);
   })

   it("HTML includes HTML entities", function() {
      // Regex pattern: /(&.+;)/ig
      const regex = /(&.+;)/ig;
      expect(html.search(regex)).not.toEqual(-1);
   })
});