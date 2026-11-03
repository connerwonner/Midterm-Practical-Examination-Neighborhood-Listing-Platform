# AI Provenance Journal

| Step / Tool | Prompt Summary | Model Output Used | Model Output Rejected & Rationale | Verification Method | Associated Git Commit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Claude: exam planning | Asked for step-by-step plan from the exam spec | Task ordering, SQL skeleton, route/component code | (fill in) | Will run SQL in Supabase and test routes | (hash) |
| Claude: scaffold fix | Pasted create-next-app error about capital letters in the folder name | Scaffold in a temp folder, copy in, rename package to lowercase | Running create-next-app with `.` in the capitalized folder: fails npm naming rules | Ran the scaffold and checked `git status` | (hash) |
