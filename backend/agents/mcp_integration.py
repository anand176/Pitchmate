"""
MCP (Model Context Protocol) integration for LangChain/LangGraph.

Uses langchain-mcp-adapters so each tool call opens a short-lived MCP session
(works reliably with stdio servers like @drawio/mcp and @figma/mcp).
"""

import logging
import os
import sys
from typing import Any

from langchain_core.tools import BaseTool
from langchain_mcp_adapters.client import MultiServerMCPClient

logger = logging.getLogger("mcp_integration")


async def get_mcp_tools(
    command: str,
    args: list[str],
    env: dict[str, str] | None = None,
    tool_filter: list[str] | None = None,
    server_name: str = "mcp",
) -> list[BaseTool]:
    """
    Load LangChain tools from an MCP stdio server.

    Args:
        command: Command to run the MCP server (e.g. "npx" / "npx.cmd")
        args: Arguments (e.g. ["-y", "@drawio/mcp"])
        env: Environment for the subprocess (defaults to os.environ)
        tool_filter: Optional allow-list of tool names
        server_name: Logical name for the MCP connection

    Returns:
        List of LangChain tools bound to the MCP server
    """
    # MultiServerMCPClient merges env with the process environment when provided.
    connection: dict[str, Any] = {
        "transport": "stdio",
        "command": command,
        "args": args,
    }
    if env is not None:
        connection["env"] = env

    client = MultiServerMCPClient({server_name: connection})
    try:
        tools = await client.get_tools()
    except Exception as e:
        logger.error("Failed to load MCP tools from %s %s: %s", command, args, e)
        raise

    if tool_filter:
        allowed = set(tool_filter)
        tools = [t for t in tools if t.name in allowed]

    logger.info(
        "Loaded %d MCP tool(s) from %s %s: %s",
        len(tools),
        command,
        " ".join(args),
        [t.name for t in tools],
    )
    return tools


def get_npx_command() -> str:
    """Return the platform-appropriate npx executable name."""
    return "npx.cmd" if sys.platform == "win32" else "npx"


def mcp_env_with_path(extra: dict[str, str] | None = None) -> dict[str, str]:
    """
    Build an env dict for MCP stdio subprocesses.

    Ensures PATH is present so npx/node resolve inside Docker/slim images.
    """
    env = dict(os.environ)
    if extra:
        env.update(extra)
    return env
