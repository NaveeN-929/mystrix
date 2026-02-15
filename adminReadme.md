# Value Guarantee Settings Key Implementation Details:
1. Value Calculation: Uses c2c field (Cost to Company) instead of price field (MRP),
2. Smart Product Selection: Prioritizes higher rarities (Jackpot → Rare → Uncommon → Common) to find products meeting minimum C2C value
3. Fallback Logic: If no products meet the exact minimum, selects next highest C2C value products available, this works even if the product stock goes empty.
4. No Empty Boxes: Skips empty box logic for positions 1 & 2 to guarantee value delivery
