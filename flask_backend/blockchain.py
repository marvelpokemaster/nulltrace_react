import hashlib
import json
from datetime import datetime

class Block:
    def __init__(self, index, timestamp, data, prev_hash):
        self.index = index
        self.timestamp = timestamp
        self.data = data
        self.prev_hash = prev_hash
        self.hash = self.calc_hash()

    def calc_hash(self):
        block_string = json.dumps({
            "index": self.index,
            "timestamp": str(self.timestamp),
            "data": self.data,
            "prev_hash": self.prev_hash
        }, sort_keys=True)
        return hashlib.sha256(block_string.encode()).hexdigest()


class Blockchain:
    def __init__(self):
        self.chain = [self.create_genesis_block()]

    def create_genesis_block(self):
        return Block(0, datetime.now(), "Genesis Block", "0")

    def get_last_block(self):
        return self.chain[-1]
    def is_valid(self):
        for i in range(1, len(self.chain)):
            curr = self.chain[i]
            prev = self.chain[i - 1]
            if curr["prev_hash"] != prev["hash"]:
                return False
            # Recalculate hash to detect tampering
            check_hash = self.hash_block(curr["index"], curr["data"], curr["timestamp"], curr["prev_hash"])
            if curr["hash"] != check_hash:
                return False
        return True


    def add_block(self, data):
        last_block = self.get_last_block()
        new_block = Block(len(self.chain), datetime.now(), data, last_block.hash)
        self.chain.append(new_block)
        return new_block

    def to_dict(self):
        return [vars(block) for block in self.chain]
