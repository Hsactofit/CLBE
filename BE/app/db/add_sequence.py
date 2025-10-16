#!/usr/bin/env python3
import re


def add_sequence_to_sql():
    with open("seed.sql", "r") as f:
        content = f.read()
    pattern = r'(INSERT INTO "public"."form_template_field".*?VALUES\s*)(.*?)(\s*;)'

    def process_values(match):
        insert_part = match.group(1)
        values_part = match.group(2)
        end_part = match.group(3)

        lines = values_part.strip().split("\n")
        new_lines = []
        seq = 0

        for line in lines:
            stripped = line.strip()

            # skip empty
            if not stripped or stripped.startswith("--"):
                new_lines.append(line)
                continue

            # find data
            match_data = re.match(r"\s*\((\d+),", stripped)
            if match_data:
                seq += 1

                # add seq
                if stripped.endswith("),"):
                    line_without_end = stripped[:-2]
                    new_line = f"    {line_without_end}, {seq}),"
                elif stripped.endswith(");"):
                    line_without_end = stripped[:-2]
                    new_line = f"    {line_without_end}, {seq});"
                elif stripped.endswith(")"):
                    line_without_end = stripped[:-1]
                    new_line = f"    {line_without_end}, {seq})"
                else:
                    new_line = line

                new_lines.append(new_line)
            else:
                new_lines.append(line)

        return insert_part + "\n".join(new_lines) + end_part

    # process
    new_content = re.sub(pattern, process_values, content, flags=re.DOTALL)

    # write into new file
    with open("seed_with_sequence.sql", "w") as f:
        f.write(new_content)

    print("generated seed_with_sequence.sql")


if __name__ == "__main__":
    add_sequence_to_sql()
