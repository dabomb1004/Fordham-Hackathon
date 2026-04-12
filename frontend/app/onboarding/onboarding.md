help create a onboarding user interface
question, i want to create an ai agent when choosing a restaurant or buying some food, the agent can search for the reviews, ingredients, and things , the dish information, personal information, and when users want to pick a restaurant buy some dishes, or food online, the LLM can provide extra layer of information like, for example, the user may ignore the allergies, and the AI can surface that, this is our basic idea, now, we want to design the user onboarding process so that we have the user information


You will start with a user profile with some pre-filled information
Like name, profile image, age, height, weight, etc., BMI, 

And then the user is going to prompt to click a button to answer a few question to complete the full profile

And then you are going to 

question 1: start with warm greetings, like, "“I’ll help you avoid unsafe foods, hidden allergens, and find better meals based on your preferences.”"

Then ask ONE simple question:
“Do you have any food allergies or dietary restrictions?”
Options:

None
Nuts
Dairy
Gluten
Seafood
Other (custom input)

question 2
Keep it checkbox + optional detail
Collect:
Allergies (multi-select)
Dietary type:
Vegan / Vegetarian / Halal / Kosher / None
Sensitivities:
Lactose intolerance
Low sodium
Low sugar

Question 3 — Preference Layer (Make It Personal)

Make it feel fun, not like a form:

Favorite cuisines:
Chinese, Italian, Japanese, Mexican, etc.
Spice level preference
Price range:
$, $$, $$$
Eating goal:
Healthy
Comfort food
High protein
Weight loss

💡 You can gamify this:
“Pick foods you love” (image-based UI works great)

Question 4 5 — Behavioral Intent (Smart Personalization)

Ask ONE question:

“What matters most when choosing food?”

Options:

Taste
Health
Price
Convenience
Safety (allergies)

This helps your agent prioritize decisions.

Do
✅ Chat-style onboarding (like this conversation)

