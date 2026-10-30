# Dados do modelo

Coloque aqui o dataset do trabalho de machine learning, por exemplo `dataset.csv` com duas colunas:

```
label,text
spam,"Você ganhou um prêmio! Clique aqui"
ham,"Chego em 10 minutos"
```

- `feedback.csv` é criado sozinho pela API quando alguém marca "É spam" ou "Não é spam" no app.
- Para treinar de novo com as correções: `python train.py data/dataset.csv data/feedback.csv`.
- Os arquivos de dados não vão para o Git se você adicionar `ml/data/*.csv` ao `.gitignore`.
