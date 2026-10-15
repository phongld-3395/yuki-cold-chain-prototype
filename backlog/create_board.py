#!/usr/bin/env python3
"""Tạo backlog LAB-5 trên GitHub: labels, issues (epic → task, subtask dạng checklist),
GitHub Project với các trường Story Points, Estimate (h), Actual (h), Sprint, Owner, Đặc thù nghiệp vụ.
Chạy trong GitHub Codespaces của repo:  python3 backlog/create_board.py
Chạy lại an toàn: những gì đã tạo được ghi trong backlog/.created.json và sẽ được bỏ qua."""
import json, os, subprocess, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = json.load(open(os.path.join(HERE, "backlog.json"), encoding="utf-8"))
STATE_FILE = os.path.join(HERE, ".created.json")
STATE = json.load(open(STATE_FILE)) if os.path.exists(STATE_FILE) else {"issues": {}, "items": {}}

def save(): json.dump(STATE, open(STATE_FILE, "w"), indent=1)

def gh(*args, parse=False, ok_fail=False):
    r = subprocess.run(["gh", *args], capture_output=True, text=True)
    if r.returncode != 0:
        if ok_fail: return None
        print("\n❌ Lỗi khi chạy: gh", " ".join(args)); print(r.stderr.strip()); sys.exit(1)
    out = r.stdout.strip()
    return json.loads(out) if parse and out else out

def step(msg): print(f"\n=== {msg}")

step("1/6 Kiểm tra đăng nhập & repo")
repo = gh("repo", "view", "--json", "nameWithOwner", parse=True)["nameWithOwner"]
owner = repo.split("/")[0]
print("Repo:", repo)
scopes = subprocess.run(["gh", "auth", "status"], capture_output=True, text=True)
if "project" not in (scopes.stdout + scopes.stderr):
    print("⚠ Chưa có quyền 'project'. Trong terminal Codespaces chạy lần lượt:\n   unset GITHUB_TOKEN\n   gh auth login -h github.com -p https -w -s project\nrồi chạy lại:  python3 backlog/create_board.py")
    sys.exit(1)

step("2/6 Tạo labels")
LABELS = [("epic", "5319E7", "Epic"), ("task", "0E8A16", "Task"), ("blocked", "B60205", "Đang bị chặn bởi phụ thuộc bên ngoài")]
LABELS += [(f"đặc thù: {c}", "FBCA04", "Hạng mục chịu ràng buộc nghiệp vụ đặc thù") for c in DATA["constraints"]]
for name, color, desc in LABELS:
    gh("label", "create", name, "--color", color, "--description", desc, "--force", ok_fail=True)
print(len(LABELS), "labels")

step("3/6 Tạo milestones (sprint)")
existing = {m["title"] for m in (gh("api", f"repos/{repo}/milestones?state=all&per_page=100", parse=True) or [])}
for s in DATA["sprints"]:
    if s not in existing: gh("api", f"repos/{repo}/milestones", "-f", f"title={s}", ok_fail=True)
print(len(DATA["sprints"]), "milestones")

step("4/6 Tạo GitHub Project & các trường")
title = DATA["project_title"]
projects = gh("project", "list", "--owner", owner, "--format", "json", "--limit", "100", parse=True)["projects"]
proj = next((p for p in projects if p["title"] == title), None)
if not proj:
    proj = gh("project", "create", "--owner", owner, "--title", title, "--format", "json", parse=True)
pnum, pid = str(proj["number"]), proj["id"]
gh("project", "link", pnum, "--owner", owner, "--repo", repo, ok_fail=True)
fields = {f["name"]: f for f in gh("project", "field-list", pnum, "--owner", owner, "--format", "json", "--limit", "50", parse=True)["fields"]}
WANT = [("Story Points", "NUMBER", None), ("Estimate (h)", "NUMBER", None), ("Actual (h)", "NUMBER", None),
        ("Owner (giả định)", "TEXT", None), ("Sprint", "SINGLE_SELECT", DATA["sprints"] + ["Backlog"]),
        ("Loại", "SINGLE_SELECT", ["Epic", "Task"]), ("Đặc thù nghiệp vụ", "SINGLE_SELECT", DATA["constraints"] + ["Không"])]
for name, dtype, opts in WANT:
    if name in fields: continue
    args = ["project", "field-create", pnum, "--owner", owner, "--name", name, "--data-type", dtype]
    if opts: args += ["--single-select-options", ",".join(opts)]
    gh(*args)
fields = {f["name"]: f for f in gh("project", "field-list", pnum, "--owner", owner, "--format", "json", "--limit", "50", parse=True)["fields"]}
def opt(field, value):
    for o in fields[field].get("options", []):
        if o["name"] == value: return o["id"]
    return None
print("Project #", pnum, "· trường:", ", ".join(n for n, _, _ in WANT))

def set_field(item, name, value):
    f = fields[name]; base = ["project", "item-edit", "--id", item, "--project-id", pid, "--field-id", f["id"]]
    if f["type"] == "ProjectV2SingleSelectField" or "options" in f:
        oid = opt(name, value)
        if oid: gh(*base, "--single-select-option-id", oid, ok_fail=True)
    elif isinstance(value, (int, float)): gh(*base, "--number", str(value), ok_fail=True)
    else: gh(*base, "--text", str(value), ok_fail=True)

def create_issue(key, title, body, labels, milestone=None):
    if key in STATE["issues"]: return STATE["issues"][key]
    args = ["issue", "create", "--title", title, "--body", body, "--label", ",".join(labels)]
    if milestone: args += ["--milestone", milestone]
    url = gh(*args).splitlines()[-1].strip()
    num = int(url.rstrip("/").split("/")[-1])
    iid = gh("api", f"repos/{repo}/issues/{num}", "--jq", ".id")
    STATE["issues"][key] = {"url": url, "number": num, "id": int(iid)}; save(); time.sleep(float(os.environ.get("GH_SLEEP","1.2")))
    return STATE["issues"][key]

def add_item(key, url):
    if key in STATE["items"]: return STATE["items"][key]
    item = gh("project", "item-add", pnum, "--owner", owner, "--url", url, "--format", "json", parse=True)["id"]
    STATE["items"][key] = item; save(); return item

step("5/6 Tạo epic & task (khoảng 70 issue – mất 3–6 phút)")
for e in DATA["epics"]:
    body = f"**Epic** · tham chiếu thiết kế LAB-4: {e['refs']}\n\nTổng: **{e['sp']} SP · {e['hours']} giờ** (cộng từ các task con).\n\nTask con xem ở mục *Sub-issues* bên dưới."
    iss = create_issue(e["key"], e["title"], body, ["epic"])
    item = add_item(e["key"], iss["url"])
    set_field(item, "Loại", "Epic"); set_field(item, "Story Points", e["sp"]); set_field(item, "Estimate (h)", e["hours"])
    print("  ✓", e["title"])
for t in DATA["tasks"]:
    epic = STATE["issues"][t["epic"]]
    checklist = "\n".join(f"- [{'x' if t['status'] == 'Done' else ' '}] {s}" for s in t["subtasks"])
    body = (f"**Epic:** #{epic['number']}  \n**Story point:** {t['sp']} · **Ước lượng:** {t['hours']} giờ · **Người phụ trách (giả định):** {t['owner']}  \n"
            f"**Sprint:** {t['sprint']} · **Đặc thù nghiệp vụ:** {t['constraint']}  \n**Tham chiếu:** {t['refs']}\n\n### Subtask\n{checklist}\n\n"
            f"### Definition of Done\n- Code review đạt, test tự động pass trong CI\n- Đúng screen spec / tiêu chí nghiệm thu LAB-4\n- Cập nhật Actual (h) trên Project")
    labels = ["task"] + ([f"đặc thù: {t['constraint']}"] if t["constraint"] != "Không" else [])
    if t["key"] in ("T-801", "T-502", "T-809", "T-808"): labels.append("blocked") if t["status"] != "Done" else None
    iss = create_issue(t["key"], t["title"], body, labels, t["sprint"])
    if not STATE.get("linked", {}).get(t["key"]):
        gh("api", "-X", "POST", f"repos/{repo}/issues/{epic['number']}/sub_issues", "-F", f"sub_issue_id={iss['id']}", ok_fail=True)
        STATE.setdefault("linked", {})[t["key"]] = True; save()
    item = add_item(t["key"], iss["url"])
    for name, val in [("Loại", "Task"), ("Story Points", t["sp"]), ("Estimate (h)", t["hours"]), ("Actual (h)", t["actual"]),
                      ("Owner (giả định)", t["owner"]), ("Sprint", t["sprint"]), ("Đặc thù nghiệp vụ", t["constraint"]), ("Status", t["status"])]:
        set_field(item, name, val)
    if t["status"] == "Done": gh("issue", "close", str(iss["number"]), ok_fail=True)
    print("  ✓", t["title"][:80])

step("6/6 Xong")
print(f"Mở Project: https://github.com/users/{owner}/projects/{pnum}")
print("Gợi ý: trong Project bấm 'New view' → Board để xem dạng cột Todo / In Progress / Done.")
