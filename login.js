const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

// Cre
const linkedInEmail = "a@gmail.com";
const linkedInPassword = "b";

// Function to log in to LinkedIn
async function loginLinkedIn() {
    let options = new chrome.Options();
    // options.addArguments('--headless');  
    options.addArguments('--disable-gpu'); 
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');

    let driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    try {
        // Navigate to LinkedIn login page
        await driver.get('https://www.linkedin.com/login');

        // Enter email and password
        await driver.wait(until.elementLocated(By.id('username')), 10000);
        await driver.findElement(By.id('username')).sendKeys(linkedInEmail);
        await driver.wait(until.elementLocated(By.id('password')), 10000);
        await driver.findElement(By.id('password')).sendKeys(linkedInPassword);
        await driver.findElement(By.id('password')).sendKeys(Key.RETURN);

        // Wait for homepage to load after login
        await driver.wait(until.urlContains('feed'), 50000);

        return driver;  // Return the driver so the profile page can be navigated later
    } catch (error) {
        console.error('Error during login:', error);
    }
}

module.exports = loginLinkedIn;  // Export the login function
