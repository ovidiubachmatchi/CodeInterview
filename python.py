a=input()
b=a.split(" ")
numere=[]
for i in b:
    numere.append(int(i))
i=len(numere)-1
numere=sorted(numere)
while i>=0:
    print(" " * len(str(numere[-1]))-len(str(numere[i])) + str(numere[i]))
    i=i-1