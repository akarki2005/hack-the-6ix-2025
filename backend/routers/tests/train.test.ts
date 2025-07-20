import * as request from "supertest";

describe("POST /train", () => {
  it("should respond with 200 and expected result", async () => {
    const response = await request("http://localhost:3000")
      .post("/train")
      .send({
        // replace with actual payload your route expects
        github_link:
          "https://github.com/akarki2005/hack-the-6ix-2025-tests/pull/2",
      })
      .set("Content-Type", "application/json");
    console.error(response.error);
    expect(response.status).toBe(200);
    // Add more specific checks if needed
    expect(response.body).toHaveProperty("success");
  }, 50000);

  it("should return 400 for invalid input", async () => {
    const response = await request("http://localhost:3000")
      .post("/train")
      .send(undefined) // or bad payload
      .set("Content-Type", "application/json");

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });
});
