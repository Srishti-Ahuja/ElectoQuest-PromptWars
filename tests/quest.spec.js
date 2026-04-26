const { test, expect } = require('@playwright/test');

test.describe('ElectoQuest E2E Journey', () => {
  test('User can register, complete onboarding, and finish Quest 1', async ({ page }) => {
    // 1. Visit the app
    await page.goto('/');

    // 2. Sign up
    await page.click('id=show-signup');
    await page.fill('id=signup-username', 'test_voter_01');
    await page.fill('id=signup-password', 'securepass');
    await page.click('id=btn-signup');

    // Wait for the signup success and toggle back to login
    await page.waitForTimeout(1500);

    // 3. Login
    await page.fill('id=login-username', 'test_voter_01');
    await page.fill('id=login-password', 'securepass');
    await page.click('id=btn-login');

    // 4. Complete Onboarding
    await expect(page.locator('id=landing')).toBeVisible();
    await page.selectOption('id=user-state', 'MH');
    await page.fill('id=user-pincode', '400001');
    await page.click('id=btn-begin');

    // 5. Dashboard View
    await expect(page.locator('id=dashboard')).toBeVisible();
    await expect(page.locator('id=display-username')).toHaveText('test_voter_01');

    // 6. Click Quest 1
    const questNode = page.locator('.node[data-quest="1"]');
    await questNode.click();

    // 7. Interact with MCQ
    await expect(page.locator('id=modal-overlay')).not.toHaveClass(/hidden/);

    // Question 1: min age (18 -> index 1)
    await page.locator('.mcq-question-block[data-idx="0"] .mcq-opt[data-opt="1"]').click();
    
    // Question 2: form for new voter (Form 6 -> index 0)
    await page.locator('.mcq-question-block[data-idx="1"] .mcq-opt[data-opt="0"]').click();
    
    // Question 3: portal (voters.eci.gov.in -> index 0)
    await page.locator('.mcq-question-block[data-idx="2"] .mcq-opt[data-opt="0"]').click();

    // 8. Complete Quest
    const completeBtn = page.locator('id=btn-complete-quest');
    await expect(completeBtn).not.toBeDisabled();
    await completeBtn.click();

    // 9. Verify completion
    await expect(page.locator('id=modal-overlay')).toHaveClass(/hidden/);
    await expect(questNode).toHaveClass(/completed/);
    
    // Progress bar should have updated
    const progressBar = page.locator('id=top-progress-bar');
    const width = await progressBar.evaluate((el) => el.style.width);
    expect(width).not.toBe('0%');
  });
});
