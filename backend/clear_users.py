import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import AsyncSessionLocal
from app.models.user import User
from sqlalchemy import delete

async def clear_users():
    async with AsyncSessionLocal() as session:
        await session.execute(delete(User))
        await session.commit()
        print("Successfully deleted all users from the database.")

if __name__ == "__main__":
    asyncio.run(clear_users())
