' Chay may chu radar o nen, khong hien cua so den.
' Dung cho muc Startup cua Windows: bat may la tu chay, khong phai nho gi.
Set s = CreateObject("WScript.Shell")
s.CurrentDirectory = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
s.Run "node lich-su-dnse.js", 0, False
