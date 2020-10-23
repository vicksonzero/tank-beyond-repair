# run me once to preview, and then pipe me into bash to run:
# ```
# ./strip_name.sh| bash
# ```


find -type f -wholename './tanks-beyond-repair_*' | sed -r -e 's/.\/tanks-beyond-repair_(.+)\.png/mv & .\/\1.png/'
