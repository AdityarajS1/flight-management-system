const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const fs = require('node:fs');
const {
  Builder,
  By,
  Select,
  until,
} = require('selenium-webdriver');

const baseUrl = process.env.APP_BASE_URL || 'http://127.0.0.1:8085';
const apiBaseUrl = process.env.API_BASE_URL || baseUrl;
const seleniumUrl = process.env.SELENIUM_REMOTE_URL || 'http://127.0.0.1:4444/wd/hub';
const waitTimeout = 20_000;

async function request(path, body) {
  const response = await fetch(new URL(path, apiBaseUrl), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  assert.equal(
    response.ok,
    true,
    `${path} failed with HTTP ${response.status}: ${JSON.stringify(data)}`
  );
  return data;
}

async function provisionScenario() {
  const unique = randomUUID().replaceAll('-', '');
  const account = {
    name: 'CI Traveler',
    email: `ci-${unique}@example.test`,
    phone: '5551234567',
    password: 'ci-test-password',
  };

  await request('/api/auth/register', account);
  const otpResult = await request('/api/auth/generate-otp', { email: account.email });
  assert.ok(otpResult.otp, 'OTP endpoint did not return the CI verification code');
  await request('/api/auth/verify-otp', { email: account.email, otp: otpResult.otp });

  const departure = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const arrival = new Date(departure.getTime() + 2 * 60 * 60 * 1000);
  const flightNumber = `CI${Date.now().toString().slice(-8)}`;
  await request('/api/flights', {
    flightNumber,
    source: 'CI Origin',
    destination: 'CI Destination',
    departureTime: departure.toISOString().slice(0, 16),
    arrivalTime: arrival.toISOString().slice(0, 16),
    price: 125,
    seatsAvailable: 5,
  });

  return { account, flightNumber };
}

async function run() {
  const { account, flightNumber } = await provisionScenario();
  const driver = await new Builder()
    .usingServer(seleniumUrl)
    .forBrowser('chrome')
    .build();

  try {
    await driver.get(`${baseUrl}/login`);
    await driver.wait(until.elementLocated(By.name('email')), waitTimeout);
    await driver.findElement(By.name('email')).sendKeys(account.email);
    await driver.findElement(By.name('password')).sendKeys(account.password);
    await driver.findElement(By.css('button[type="submit"]')).click();
    await driver.wait(until.elementLocated(By.css('.dashboard-home')), waitTimeout);
    console.log('PASS: login');

    await driver.findElement(By.id('source')).sendKeys('CI Origin');
    await driver.findElement(By.id('destination')).sendKeys('CI Destination');
    await driver.findElement(By.css('.search-section button.search-btn')).click();
    const bookButton = By.xpath(
      `//div[contains(@class,'featured-flight-card')][.//*[contains(normalize-space(), '${flightNumber}')]]//button[contains(@class,'book-now-btn')]`
    );
    await driver.wait(async () => {
      const buttons = await driver.findElements(bookButton);
      if (buttons.length === 0) return false;
      try {
        await buttons[0].click();
        return true;
      } catch (error) {
        if (error.name === 'StaleElementReferenceError') return false;
        throw error;
      }
    }, waitTimeout, 'Seeded flight did not appear in search results');
    console.log('PASS: flight search');

    await driver.wait(until.elementLocated(By.css('.booking-page')), waitTimeout);
    await driver.findElement(By.name('name')).sendKeys('CI Traveler');
    await driver.findElement(By.name('phone')).sendKeys(account.phone);
    await driver.findElement(By.name('age')).sendKeys('30');
    await new Select(await driver.findElement(By.name('gender'))).selectByVisibleText('Other');
    await driver.findElement(By.css('.booking-page button[type="submit"]')).click();
    await driver.wait(until.elementLocated(By.css('.payment-page')), waitTimeout);
    await driver.findElement(By.css('.demo-pay-button')).click();
    await driver.wait(until.elementLocated(By.css('.payment-success')), waitTimeout);
    console.log('PASS: booking');

    await driver.findElement(By.css('.payment-success .dashboard-btn')).click();
    await driver.wait(until.elementLocated(By.css('.dashboard-home')), waitTimeout);
    const cancelButton = await driver.wait(
      until.elementLocated(By.xpath("//button[normalize-space()='Cancel Ticket']")),
      waitTimeout
    );
    await cancelButton.click();
    await driver.wait(until.alertIsPresent(), waitTimeout);
    await (await driver.switchTo().alert()).accept();
    await driver.wait(
      until.elementLocated(By.css('.status-badge.cancelled')),
      waitTimeout,
      'Booking was not shown as cancelled'
    );
    console.log('PASS: cancellation');
  } catch (error) {
    try {
      fs.writeFileSync('e2e-failure.png', await driver.takeScreenshot(), 'base64');
    } catch (screenshotError) {
      console.error('Could not save Selenium failure screenshot:', screenshotError.message);
    }
    throw error;
  } finally {
    await driver.quit();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
