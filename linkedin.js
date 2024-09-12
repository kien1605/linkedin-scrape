// profile.js
const express = require('express');
const loginLinkedIn = require('./login');  // Import the login function
const { By, until } = require('selenium-webdriver');

const app = express();
const port = 3000;

// Create API GET method to fetch LinkedIn profile data
app.get('/api/profile', async (req, res) => {
    const profileUrl = req.query.url;  // Get the LinkedIn profile URL from the query parameter
    if (!profileUrl) {
        return res.status(400).send('Please provide a LinkedIn profile URL in the query parameter.');
    }

    let userInfo = {
        name: null,
        title: null,
        summary: null,
        address: null,
        pictureUrl: null,
        positions: [],
        educations: [],
        certifications: [],
        skills: []
    };

    const driver = await loginLinkedIn();  // Call the login function to log in and get the driver instance

    try {
        await driver.get(profileUrl);

        // Scrape profile info (similar to your existing code)
        await driver.wait(until.elementLocated(By.css('h1.text-heading-xlarge')), 15000);
        userInfo.name = await driver.findElement(By.css('h1.text-heading-xlarge')).getText();
        userInfo.title = await driver.findElement(By.css('div.text-body-medium')).getText();

        const summary_xpath = await driver.wait(until.elementLocated(By.xpath('//*[@id="profile-content"]/div/div[2]/div/div/main/section[2]/div[3]/div/div/div/span[1]')), 15000);
        userInfo.summary = await summary_xpath.getText();

        const imgElement = await driver.wait(until.elementLocated(By.xpath('//*[@id="ember33"]')), 15000);
        userInfo.pictureUrl = await imgElement.getAttribute('src');

        const xpath_address = '//*[@id="profile-content"]/div/div[2]/div/div/main/section[1]/div[2]/div[2]/div[2]/span[1]';
        userInfo.address = await driver.findElement(By.xpath(xpath_address)).getText();

        await GetExp(driver, userInfo);
        userInfo.educations.push(await getEducation(driver));

        await getCertifications(driver, userInfo, profileUrl);
        await getSkill(driver, userInfo, profileUrl);

        res.json(userInfo);
    } catch (err) {
        res.status(500).send(`Error scraping profile: ${err.message}`);
    } finally {
        // await driver.quit(); 
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});



async function getCertifications(driver, userInfo, url){
    await driver.get(url + 'details/certifications/');
    await driver.wait(until.elementLocated(By.xpath('//*[@id="profile-content"]/div/div[2]/div/div/main/section/div[1]/div/h2')), 5000);

    const certification_xpath = await driver.wait(until.elementsLocated(By.className('pvs-list__paged-list-item')), 1000);
    for (let i = 0; i < certification_xpath.length; i++) {
        let certifications = {
            certName: null,
            // timePeriod: null
        };
        try {
            const xpath_certname = `/html/body/div[4]/div[3]/div/div/div[2]/div/div/main/section/div[2]/div/div[1]/ul/li[${i+1}]/div/div/div[2]/div[1]/a/div/div/div/div/span[1]`;
            const liElement = certification_xpath[i];
            const id = await liElement.getAttribute('id');
            // const xpath_certname = 
            const parentElement = await driver.findElement(By.xpath(xpath_certname));
            certifications.certName = await parentElement.getText();
            userInfo.certifications.push(certifications);
        } catch (err) {
            try{
                const xpath_certname1 = `/html/body/div[4]/div[3]/div/div/div[2]/div/div/main/section/div[2]/div/div[1]/ul/li[${i+1}]/div/div/div[2]/div[1]/div/div/div/div/div/span[1]`;
                const parentElement1 = await driver.findElement(By.xpath(xpath_certname1));
                certifications.certName = await parentElement1.getText();
                userInfo.certifications.push(certifications);
            }catch (err){}          
        }
        // console.log(certifications);
    }

}
async function scrollToBottom(driver, xpath) {
    try {
        // Find all elements that match the XPath
        const elements = await driver.wait(until.elementsLocated(By.xpath(xpath)), 1000);
        // console.log(elements.length);
        if (elements.length > 0) {
            // Get the last element in the list
            const lastElement = elements[elements.length - 1];
            // console.log(lastElement);
            // Scroll the last element into view
            await driver.executeScript("arguments[0].scrollIntoView()", lastElement);

            // Optionally, wait for the content to load or any asynchronous behavior
            await driver.sleep(100); // Adjust wait time if needed
        } else {
            console.log('No elements found for the provided XPath');
        }
    } catch (error) {
        console.error('Error during scrolling:', error);
    }
};


async function getSkill(driver, userInfo, url) {
    await driver.get(url + 'details/skills/');
    
    await driver.wait(until.elementLocated(By.xpath('//*[@id="profile-content"]/div/footer')), 1000);
    const element = driver.findElement(By.xpath('//*[@id="profile-content"]/div/footer'));
    driver.executeScript("arguments[0].scrollIntoView()", element);
    driver.sleep(5000);
    // await scrollToBottom(driver, `//*[@id="profile-content"]/div/footer`);

    const skill_xpath = await driver.wait(until.elementsLocated(By.className(`pvs-list__paged-list-item`)), 1000);
    console.log('lenght: ' + skill_xpath.length);

    for (let i = 0; i < skill_xpath.length; i++) {
        let skills = {skillName: null};
        try{
            const liElement = skill_xpath[i];
            const id = await liElement.getAttribute('id');
            const xpath_query = `//*[@id="${id}"]/div/div/div[2]/div[1]/a/div/div/div/div/span[1]`; 
             
            const _name = await driver.findElement(By.xpath(xpath_query)).getText();
            // console.log(_name);
            if(_name !== ''){
                skills.skillName = _name;
                userInfo.skills.push(skills);
            }else{
                const full_xpath = `//*[@id="profilePagedListComponent-ACoAAAvYJpoBgBlloppbJ7xTMSjVBR0BHNw4YO4-SKILLS-VIEW-DETAILS-profileTabSection-ALL-SKILLS-NONE-en-US-20"]/div/div/div[2]/div[1]/a/div/div/div/div/span[1]`;
                const a = await driver.wait(until.elementLocated(By.xpath(full_xpath)),5000);
                console.log('item: ' + await a.getText());
                // const xpath_query1 = `//*[@id="profilePagedListComponent-ACoAAAvYJpoBgBlloppbJ7xTMSjVBR0BHNw4YO4-SKILLS-VIEW-DETAILS-profileTabSection-ALL-SKILLS-NONE-en-US-20"]/div/div/div[2]/div[1]/a/div/div/div/div/span[1]`; // XPath adjusted
                // const _name1 = await driver.findElement(By.xpath(xpath_query1)).getText();
                // skills.skillName = _name1;
                // userInfo.skills.push(skills);         
        }
            console.log('xpath: '+xpath_query);
        }catch(err){
            console.log(err);
        }

        // const skill_xpath1 = await driver.wait(until.elementsLocated(By.className(`pvs-list__paged-list-item`)), 1000);

    
    
        // console.log(skill_xpath1.length);
    }
}

async function getEducation(driver){
    let education = {
        degreeName: null,
        schoolName: null,
        timePeriod: {
            startYear: null,
            endYear: null
        }
    }
    const education_name = await driver.wait(until.elementLocated(By.xpath('//*[@id="profile-content"]/div/div[2]/div/div/main/section[5]/div[3]/ul/li/div/div[2]/div[1]/a/div/div/div/div/span[1]')), 15000);
    education.degreeName = await education_name.getText();

    const schoolNameawait = await driver.wait(until.elementLocated(By.xpath('//*[@id="profile-content"]/div/div[2]/div/div/main/section[5]/div[3]/ul/li/div/div[2]/div[1]/a/span[1]/span[1]')), 15000);
    const timePeriodawait=  await driver.wait(until.elementLocated(By.xpath('//*[@id="profile-content"]/div/div[2]/div/div/main/section[5]/div[3]/ul/li/div/div[2]/div[1]/a/span[2]/span[1]')), 15000);
    
    education.schoolName = await schoolNameawait.getText();
    const timePeriodText = await timePeriodawait.getText();

    if(timePeriodText){
        const [startYear, endYear] = timePeriodText.split('-').map(year => year.trim());
        education.timePeriod.startYear = startYear;
        education.timePeriod.endYear = endYear;
    }
    return education;
}

async function GetExp(driver, userInfo){
    const userExp = await driver.wait(until.elementsLocated(By.xpath('//*[@id="profile-content"]/div/div[2]/div/div/main/section[4]/div[3]/ul/li')), 5000);

    for (let i = 1; i <= userExp.length; i++) {
        let position = {
            title: null,
            locationName: null,
            timePeriod: null
        };
        const xpathTitle = `//*[@id="profile-content"]/div/div[2]/div/div/main/section[4]/div[3]/ul/li[${i}]/div/div[2]/div[1]/div/div/div/div/div/span[1]`;
        const xpathLocation = `//*[@id="profile-content"]/div/div[2]/div/div/main/section[4]/div[3]/ul/li[${i}]/div/div[2]/div[1]/div/span[3]/span[1]`;

        try {
            const titleElement = await driver.wait(until.elementLocated(By.xpath(xpathTitle)), 5000);
            position.title = await titleElement.getText();
            const locationElement = await driver.wait(until.elementLocated(By.xpath(xpathLocation)), 5000);
            position.locationName = await locationElement.getText();
            userInfo.positions.push(position);
        } catch (err) {
        }
    }
}