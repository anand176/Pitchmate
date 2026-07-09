"""
MCP (Model Context Protocol) integration for LangChain/LangGraph.
Provides utilities to connect MCP servers as LangChain tools.
"""

import asyncio
import logging
import os
import sys
from typing import Any

from langchain_core.tools import StructuredTool
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

logger = logging.getLogger("mcp_integration")


class MCPToolWrapper:
    """
    Wrapper for MCP server tools to be used with LangChain.
    """

    def __init__(self, server_params: StdioServerParameters, tool_name_filter: list[str] | None = None):
        """
        Initialize MCP tool wrapper.
        
        Args:
            server_params: StdioServerParameters for the MCP server
            tool_name_filter: Optional list of tool names to expose (None = all tools)
        """
        self.server_params = server_params
        self.tool_name_filter = tool_name_filter
        self._session: ClientSession | None = None
        self._read_stream = None
        self._write_stream = None

    async def _ensure_connected(self):
        """Ensure connection to MCP server is established."""
        if self._session is None:
            try:
                self._read_stream, self._write_stream = await stdio_client(self.server_params)
                self._session = ClientSession(self._read_stream, self._write_stream)
                await self._session.initialize()
                logger.info(f"Connected to MCP server: {self.server_params.command}")
            except Exception as e:
                logger.error(f"Failed to connect to MCP server: {e}")
                raise

    async def get_tools(self) -> list[StructuredTool]:
        """
        Get all tools from the MCP server as LangChain StructuredTools.
        
        Returns:
            List of StructuredTool instances
        """
        await self._ensure_connected()
        
        # List available tools from MCP server
        tools_list = await self._session.list_tools()
        
        langchain_tools = []
        for tool_info in tools_list.tools:
            # Filter tools if specified
            if self.tool_name_filter and tool_info.name not in self.tool_name_filter:
                continue
            
            # Create async function for this tool
            async def call_mcp_tool(**kwargs) -> str:
                tool_name_captured = tool_info.name
                await self._ensure_connected()
                result = await self._session.call_tool(tool_name_captured, arguments=kwargs)
                # Extract text content from result
                if hasattr(result, 'content') and result.content:
                    return str(result.content[0].text if result.content else "")
                return str(result)
            
            # Create LangChain StructuredTool
            langchain_tool = StructuredTool.from_function(
                coroutine=call_mcp_tool,
                name=tool_info.name,
                description=tool_info.description or f"MCP tool: {tool_info.name}",
            )
            langchain_tools.append(langchain_tool)
        
        logger.info(f"Loaded {len(langchain_tools)} tools from MCP server")
        return langchain_tools

    async def close(self):
        """Close connection to MCP server."""
        if self._session:
            try:
                await self._session.__aexit__(None, None, None)
            except Exception as e:
                logger.warning(f"Error closing MCP session: {e}")
            finally:
                self._session = None


async def get_mcp_tools(
    command: str,
    args: list[str],
    env: dict[str, str] | None = None,
    tool_filter: list[str] | None = None,
) -> list[StructuredTool]:
    """
    Helper function to get tools from an MCP server.
    
    Args:
        command: Command to run the MCP server (e.g., "npx")
        args: Arguments for the command (e.g., ["-y", "@figma/mcp"])
        env: Environment variables (defaults to os.environ)
        tool_filter: Optional list of tool names to include
        
    Returns:
        List of LangChain StructuredTool instances
    """
    server_params = StdioServerParameters(
        command=command,
        args=args,
        env=env or dict(os.environ),
    )
    
    wrapper = MCPToolWrapper(server_params, tool_filter)
    try:
        tools = await wrapper.get_tools()
        return tools
    finally:
        await wrapper.close()


# Platform-specific NPX command
def get_npx_command() -> str:
    """Get the appropriate npx command for the current platform."""
    return "npx.cmd" if sys.platform == "win32" else "npx"
