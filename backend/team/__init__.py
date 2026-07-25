"""
Lightweight team-sharing: every user has a `team_id` (see db/models.py User);
inviting a cofounder reassigns their team_id to yours so cofounders see the
same StartupProfile, fundraise pipeline, roadmap, and cash snapshots. No
roles/permissions — every teammate has equal read/write access to everything.
"""
