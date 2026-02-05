import logging

logger = logging.getLogger(__name__)

async def pin_file_to_ipfs(file_path: str) -> str:
    """
    Dummy implementation of IPFS pinning.
    Returns a mock CID.
    """
    logger.info(f"Pinning file to IPFS: {file_path}")
    return "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtbq55qvrqi"

async def pin_json_to_ipfs(data: dict) -> str:
    """
    Dummy implementation of IPFS pinning for JSON.
    Returns a mock CID.
    """
    logger.info(f"Pinning JSON to IPFS: {data}")
    return "bafkreihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvycu"
