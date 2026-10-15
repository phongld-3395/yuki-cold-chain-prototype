# Backlog LAB-5 – tạo GitHub Project tự động

- `backlog.json`: 10 epic, 58 task (story point, giờ ước lượng, giờ thực tế Sprint 1, người phụ trách giả định, sprint, trạng thái, đặc thù nghiệp vụ, subtask).
- `create_board.py`: tạo labels, milestones (sprint), issues (epic → task là sub-issue, subtask là checklist), GitHub Project và điền các trường.

Chạy trong GitHub Codespaces của repo:

```bash
unset GITHUB_TOKEN
gh auth login -h github.com -p https -w -s project
python3 backlog/create_board.py
```

Chạy lại an toàn: những gì đã tạo được ghi trong `backlog/.created.json` và được bỏ qua.
