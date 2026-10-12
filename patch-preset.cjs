const fs = require("fs");

const p = "src/app/(auth)/login/page.tsx";
let s = fs.readFileSync(p, "utf8");

let ok = 0;
for (let k = 0; k < 3; k++) {
  const old =
    "              onClick={() => fillDevCredentials(DEV_ACCOUNTS[" + k + "])}";
  const neu =
    "              onPointerDown={() => handlePresetPointerDown(" +
    k +
    ")}\n" +
    "              onClick={() => fillDevCredentials(DEV_ACCOUNTS[" +
    k +
    "])}";
  if (s.includes(old)) {
    s = s.split(old).join(neu);
    ok++;
    console.log("OK " + k);
  } else {
    console.log("MISS " + k);
  }
}

fs.writeFileSync(p, s);
console.log("patched " + ok + "/3");
